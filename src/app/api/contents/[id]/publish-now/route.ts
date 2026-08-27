import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getMetaToken } from '@/lib/meta-token'
import { cleanupAfterPublish } from '@/lib/cleanup-media'
import { findExistingRehost } from '@/lib/rehost-video'

// Publicação pode demorar até 3 min aguardando processamento do vídeo no Instagram
export const maxDuration = 300
export const dynamic = 'force-dynamic'

const GRAPH = 'https://graph.facebook.com/v21.0'

// ── Helpers ───────────────────────────────────────────────────────────────

function resolveUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const match = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([^/?&]+)/)
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`
  return url
}

function resolveVideoUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const match = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([^/?&]+)/)
  if (match) return `https://drive.usercontent.google.com/download?id=${match[1]}&export=download&confirm=t`
  return url
}

function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return /\.(mp4|mov|avi|webm|m4v)(\?|$)/i.test(url)
}

// Google Drive URLs não têm extensão — verifica Content-Type real para distinguir imagem de vídeo
function isDriveUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return /drive\.google\.com/.test(url)
}

async function isVideoDriveUrl(url: string | null | undefined): Promise<boolean> {
  if (!url) return false
  if (!isDriveUrl(url)) return isVideoUrl(url)
  try {
    const videoUrl = resolveVideoUrl(url) ?? url
    const resp = await fetch(videoUrl, { method: 'HEAD' })
    const ct = resp.headers.get('content-type') ?? ''
    return ct.startsWith('video/')
  } catch {
    return false
  }
}

// Re-hospeda vídeo do Drive no Supabase Storage e retorna URL pública permanente
async function rehostDriveVideoForPublish(
  driveUrl: string,
  clientId: string,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<string> {
  try {
    const match = driveUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([^/?&]+)/)
    if (!match) return driveUrl
    const fileId = match[1]

    // Reaproveita cópia existente em vez de baixar e gravar de novo
    const existing = await findExistingRehost(clientId, fileId, supabase)
    if (existing) return existing

    const downloadUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`

    const videoResp = await fetch(downloadUrl)
    if (!videoResp.ok) return driveUrl

    const contentType = videoResp.headers.get('content-type') ?? 'video/mp4'
    if (!contentType.startsWith('video/')) return driveUrl

    const buffer = await videoResp.arrayBuffer()
    const ext = contentType.split('/')[1]?.split(';')[0]?.trim() ?? 'mp4'
    // ID do Drive no nome para permitir a limpeza pós-publicação
    const path = `${clientId}/drive-${fileId}-${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('media')
      .upload(path, new Uint8Array(buffer), { contentType })

    if (error) return driveUrl

    // Salvar URL no banco para evitar re-hospedar toda vez
    await supabase.from('contents').update({ generated_image_url: supabase.storage.from('media').getPublicUrl(path).data.publicUrl })
      .eq('client_id', clientId)
      .eq('generated_image_url', driveUrl)

    return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
  } catch {
    return driveUrl
  }
}

async function postForm(url: string, params: Record<string, string>): Promise<any> {
  const body = new URLSearchParams(params).toString()
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const text = await resp.text()
  try { return JSON.parse(text) } catch { return {} }
}

// Troca o System User Token por um Page Access Token (necessário para /photos e /feed)
async function getPageAccessToken(pageId: string, systemUserToken: string): Promise<string> {
  const resp = await fetch(`${GRAPH}/${pageId}?fields=access_token&access_token=${systemUserToken}`)
  const data = await resp.json().catch(() => ({}))
  return data.access_token ?? systemUserToken
}

// ── Route ─────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: contentId } = await params
  const supabase = createServiceClient()

  // Aceitar overrides do formulário (URL atual que pode não ter sido salva no banco ainda)
  const body = await req.json().catch(() => ({}))
  const overrideVideoUrl: string | null = body?.override_video_url ?? null
  const overrideMediaUrls: string | null = body?.override_media_urls ?? null

  // Buscar conteúdo
  const { data: content } = await supabase
    .from('contents')
    .select('id, client_id, type, caption, generated_image_url, media_urls')
    .eq('id', contentId)
    .single()

  if (!content) {
    return NextResponse.json({ error: 'Conteúdo não encontrado' }, { status: 404 })
  }

  // Buscar dados do cliente
  const { data: client } = await supabase
    .from('clients')
    .select('facebook_page_id, facebook_page_token, instagram_account_id')
    .eq('id', content.client_id)
    .single()

  const pageToken = getMetaToken(client?.facebook_page_token)

  if (!client?.facebook_page_id || !pageToken) {
    return NextResponse.json(
      { error: 'Integrações Meta não configuradas para este cliente' },
      { status: 400 },
    )
  }

  const type = (content.type as string) || 'imagem'
  const isStory = type === 'story'

  // Usar override do formulário se fornecido (usuário pode ter trocado o vídeo sem salvar)
  let generatedImageUrl: string | null = overrideVideoUrl ?? (content.generated_image_url as string | null)

  // Parsear media_urls: override tem prioridade (texto com linhas) ou banco (array)
  let mediaUrls: string[] = []
  if (overrideMediaUrls) {
    mediaUrls = overrideMediaUrls.split(/[\n,]+/).map((u: string) => u.trim()).filter(Boolean)
  } else if (Array.isArray(content.media_urls)) {
    mediaUrls = (content.media_urls as string[]).filter(Boolean)
  }

  // Para Reels: o Instagram não consegue baixar vídeos direto do Google Drive.
  // É obrigatório re-hospedar no Supabase antes de publicar.
  if ((type === 'reel') && isDriveUrl(generatedImageUrl)) {
    const rehosted = await rehostDriveVideoForPublish(generatedImageUrl!, content.client_id, supabase)
    if (isDriveUrl(rehosted)) {
      // Rehosting falhou (arquivo privado, muito grande, ou Drive bloqueou o download)
      return NextResponse.json({
        ok: false,
        facebook: { post_id: null, error: 'O vídeo está no Google Drive e não pôde ser baixado automaticamente. Use o botão "Subir vídeo do computador" para hospedar no Supabase e tente publicar novamente.' },
        instagram: { post_id: null, error: 'O vídeo está no Google Drive e não pôde ser baixado automaticamente. Use o botão "Subir vídeo do computador" para hospedar no Supabase e tente publicar novamente.' },
      })
    }
    // Rehosting OK → usa URL pública permanente do Supabase
    generatedImageUrl = rehosted
  }

  const resolvedImageUrl = resolveUrl(generatedImageUrl)

  let fbPostId: string | null = null
  let fbError: string | null = null
  let igPostId: string | null = null
  let igError: string | null = null

  // ── Facebook ─────────────────────────────────────────────────────────────
  // Troca System User Token por Page Access Token para operações na página
  const fbPageToken = await getPageAccessToken(client.facebook_page_id, pageToken)

  try {
    if (isStory) {
      const storyUrls =
        mediaUrls.length > 0 ? mediaUrls : resolvedImageUrl ? [resolvedImageUrl] : []
      for (const frameUrl of storyUrls) {
        const isVid = await isVideoDriveUrl(frameUrl)
        const resolved = isVid ? resolveVideoUrl(frameUrl)! : resolveUrl(frameUrl)!
        const endpoint = isVid
          ? `${GRAPH}/${client.facebook_page_id}/video_stories`
          : `${GRAPH}/${client.facebook_page_id}/photo_stories`
        const fbResp = await postForm(
          endpoint,
          isVid
            ? { file_url: resolved, access_token: fbPageToken }
            : { url: resolved, access_token: fbPageToken },
        )
        if (fbResp.post_id || fbResp.id) fbPostId = fbResp.post_id || fbResp.id
        if (fbResp.error && !fbPostId) fbError = fbResp.error.message
      }
    } else if (type === 'reel') {
      const fbResp = await postForm(`${GRAPH}/${client.facebook_page_id}/videos`, {
        file_url: resolveVideoUrl(generatedImageUrl) ?? '',
        published: 'true',
        description: content.caption ?? '',
        access_token: fbPageToken,
      })
      fbPostId = fbResp.id ?? null
      // Capturar erro em qualquer formato que o Facebook retornar
      fbError = fbResp.error?.message ?? (fbResp.error ? JSON.stringify(fbResp.error) : null)
    } else if (type === 'carrossel' && mediaUrls.length >= 2) {
      const photoIds: string[] = []
      for (const url of mediaUrls) {
        const photoResp = await postForm(`${GRAPH}/${client.facebook_page_id}/photos`, {
          url: resolveUrl(url) ?? '',
          published: 'false',
          access_token: fbPageToken,
        })
        if (photoResp.id) photoIds.push(photoResp.id)
      }
      if (photoIds.length >= 1) {
        const fbResp = await postForm(`${GRAPH}/${client.facebook_page_id}/feed`, {
          message: content.caption ?? '',
          attached_media: JSON.stringify(photoIds.map((id) => ({ media_fbid: id }))),
          published: 'true',
          access_token: fbPageToken,
        })
        fbPostId = fbResp.id ?? null
        fbError = fbResp.error?.message ?? null
      }
    } else {
      // Imagem simples
      const endpoint = resolvedImageUrl
        ? `${GRAPH}/${client.facebook_page_id}/photos`
        : `${GRAPH}/${client.facebook_page_id}/feed`
      const fbResp = await postForm(
        endpoint,
        resolvedImageUrl
          ? { url: resolvedImageUrl, caption: content.caption ?? '', published: 'true', access_token: fbPageToken }
          : { message: content.caption ?? '', published: 'true', access_token: fbPageToken },
      )
      fbPostId = fbResp.id ?? null
      fbError = fbResp.error?.message ?? null
    }
  } catch (e: any) {
    fbError = String(e.message)
  }

  // ── Instagram ─────────────────────────────────────────────────────────────
  if (client.instagram_account_id) {
    const igId = client.instagram_account_id.trim()

    const igCreateAndPublish = async (containerParams: Record<string, string>) => {
      const container = await postForm(`${GRAPH}/${igId}/media`, containerParams)
      if (container.error) {
        const e = container.error
        const detail = `${e.message} (type: ${e.type ?? '?'}, code: ${e.code ?? '?'}${e.error_subcode ? `, subcode: ${e.error_subcode}` : ''})`
        return { post_id: null as string | null, error: detail }
      }
      if (!container.id) return { post_id: null, error: 'Instagram não retornou creation_id' }

      // Aguardar container ficar FINISHED (Instagram pode demorar ~2-3 min para vídeos)
      // 45 iterações × 4s = 3 minutos de polling máximo
      let finished = false
      for (let t = 0; t < 45; t++) {
        await new Promise((r) => setTimeout(r, 4000))
        const st = await fetch(`${GRAPH}/${container.id}?fields=status_code,status&access_token=${pageToken}`)
          .then((r) => r.json()).catch(() => ({}))
        if (st.status_code === 'FINISHED') { finished = true; break }
        if (st.status_code === 'ERROR') {
          const detail = st.status ?? JSON.stringify(st)
          return { post_id: null, error: `IG processamento falhou: ${detail}` }
        }
        // IN_PROGRESS ou sem status_code — continua aguardando
      }

      if (!finished) {
        return { post_id: null, error: 'Instagram está processando o vídeo (demorou mais de 3 min). Tente publicar novamente em alguns minutos.' }
      }

      const publish = await postForm(`${GRAPH}/${igId}/media_publish`, {
        creation_id: container.id,
        access_token: pageToken,
      })
      return {
        post_id: (publish.id ?? null) as string | null,
        error: (publish.error?.message ?? null) as string | null,
      }
    }

    try {
      if (type === 'carrossel' && mediaUrls.length >= 2) {
        const itemIds: string[] = []
        for (const url of mediaUrls) {
          const item = await postForm(`${GRAPH}/${igId}/media`, {
            image_url: resolveUrl(url) ?? '',
            is_carousel_item: 'true',
            access_token: pageToken,
          })
          if (item.error) { igError = item.error.message; break }
          if (item.id) itemIds.push(item.id)
        }
        if (!igError && itemIds.length >= 2) {
          const res = await igCreateAndPublish({
            media_type: 'CAROUSEL',
            children: itemIds.join(','),
            caption: content.caption ?? '',
            access_token: pageToken,
          })
          igPostId = res.post_id
          igError = res.error
        }
      } else if (type === 'reel') {
        const res = await igCreateAndPublish({
          media_type: 'REELS',
          video_url: resolveVideoUrl(generatedImageUrl) ?? generatedImageUrl ?? '',  // mesma lógica do story
          caption: content.caption ?? '',
          share_to_feed: 'true',
          access_token: pageToken,
        })
        igPostId = res.post_id
        igError = res.error
      } else if (isStory) {
        const storyUrls =
          mediaUrls.length > 0 ? mediaUrls : resolvedImageUrl ? [resolvedImageUrl] : []
        for (const frameUrl of storyUrls) {
          const isVid = await isVideoDriveUrl(frameUrl)
          const resolved = isVid ? resolveVideoUrl(frameUrl)! : resolveUrl(frameUrl)!
          const storyParams: Record<string, string> = { media_type: 'STORIES', access_token: pageToken }
          if (isVid) storyParams.video_url = resolved
          else storyParams.image_url = resolved
          const res = await igCreateAndPublish(storyParams)
          if (res.post_id) igPostId = res.post_id
          if (res.error && !igPostId) igError = res.error
        }
      } else if (resolvedImageUrl) {
        const res = await igCreateAndPublish({
          image_url: resolvedImageUrl,
          caption: content.caption ?? '',
          access_token: pageToken,
        })
        igPostId = res.post_id
        igError = res.error
      }
    } catch (e: any) {
      igError = String(e.message)
    }
  }

  // ── Atualizar Supabase ────────────────────────────────────────────────────
  const updateData: Record<string, unknown> = { status: 'published' }
  if (fbPostId) updateData.facebook_post_id = fbPostId
  if (igPostId) updateData.instagram_post_id = igPostId

  await supabase.from('contents').update(updateData).eq('id', contentId)

  // Publicou em alguma rede: a cópia do vídeo no Supabase já cumpriu o papel.
  // Se nada foi publicado, o arquivo fica para a próxima tentativa.
  let cleaned = 0
  if (fbPostId || igPostId) {
    const { removed } = await cleanupAfterPublish(contentId, supabase)
    cleaned = removed
  }

  return NextResponse.json({
    ok: true,
    facebook: { post_id: fbPostId, error: fbError },
    instagram: { post_id: igPostId, error: igError },
    media_liberada: cleaned,
  })
}
