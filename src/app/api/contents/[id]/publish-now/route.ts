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

    // O drive.usercontent tem rate limit e às vezes devolve HTML/parcial —
    // tenta algumas vezes antes de desistir para não bloquear por
    // instabilidade momentânea do Google.
    let buffer: ArrayBuffer | null = null
    let contentType = ''
    for (let attempt = 0; attempt < 3 && !buffer; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 3000))
      try {
        const resp = await fetch(downloadUrl, { signal: AbortSignal.timeout(120_000) })
        if (!resp.ok) continue
        const ct = resp.headers.get('content-type') ?? ''
        // Drive devolve página HTML de "confirmação de verificação" para
        // arquivos grandes ou sob rate limit — não é o vídeo.
        if (!ct.startsWith('video/') && !ct.startsWith('application/octet-stream')) continue
        const expectedLen = Number(resp.headers.get('content-length') || 0)
        const buf = await resp.arrayBuffer()
        // Download truncado ou pequeno demais para ser vídeo.
        if (expectedLen > 0 && buf.byteLength < expectedLen * 0.98) continue
        if (buf.byteLength < 50_000) continue
        buffer = buf
        contentType = ct
      } catch {
        // tenta de novo
      }
    }
    if (!buffer) return driveUrl

    const ext = contentType.includes('quicktime') ? 'mov' : 'mp4'
    // ID do Drive no nome para permitir a limpeza pós-publicação
    const path = `${clientId}/drive-${fileId}-${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('media')
      .upload(path, new Uint8Array(buffer), { contentType: ext === 'mov' ? 'video/quicktime' : 'video/mp4' })

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

// Vídeo em /video_stories exige upload resumível em 3 fases — um POST direto
// com file_url dá "(#100) The parameter upload_phase is required." A fase de
// transferência aceita o header file_url para o Facebook buscar a URL
// remotamente, sem precisar fazer stream dos bytes aqui.
async function publishFacebookVideoStory(
  pageId: string,
  videoUrl: string,
  pageToken: string,
): Promise<{ post_id: string | null; error: string | null }> {
  const start = await postForm(`${GRAPH}/${pageId}/video_stories`, {
    upload_phase: 'start',
    access_token: pageToken,
  })
  const videoId = start.video_id as string | undefined
  const uploadUrl = start.upload_url as string | undefined
  if (!videoId || !uploadUrl) {
    return { post_id: null, error: start.error?.message ?? 'Falha ao iniciar upload do story (fase start)' }
  }

  const transferResp = await fetch(uploadUrl, {
    method: 'POST',
    headers: { Authorization: `OAuth ${pageToken}`, file_url: videoUrl },
  })
  const transferData = await transferResp.json().catch(() => ({}))
  if (!transferResp.ok || transferData.success === false) {
    return { post_id: null, error: transferData.error?.message ?? 'Falha ao transferir o vídeo do story (fase transfer)' }
  }

  const finish = await postForm(`${GRAPH}/${pageId}/video_stories`, {
    upload_phase: 'finish',
    video_id: videoId,
    access_token: pageToken,
  })
  if (finish.post_id) return { post_id: finish.post_id, error: null }
  return { post_id: null, error: finish.error?.message ?? 'Falha ao publicar o story (fase finish)' }
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
    .select('id, client_id, type, caption, generated_image_url, media_urls, facebook_post_id, instagram_post_id')
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

  // Já publicado antes (retry manual após falha parcial): reaproveita o id
  // existente em vez de publicar de novo — sem isso, clicar "Publicar agora"
  // numa publicação que já tinha saído no Facebook cria um post duplicado.
  let fbPostId: string | null = (content.facebook_post_id as string | null) ?? null
  let fbError: string | null = null
  let igPostId: string | null = (content.instagram_post_id as string | null) ?? null
  let igError: string | null = null

  // ── Facebook ─────────────────────────────────────────────────────────────
  // Troca System User Token por Page Access Token para operações na página
  const fbPageToken = await getPageAccessToken(client.facebook_page_id, pageToken)

  if (fbPostId) {
    // já publicado numa tentativa anterior — não repete
  } else try {
    if (isStory) {
      const storyUrls =
        mediaUrls.length > 0 ? mediaUrls : resolvedImageUrl ? [resolvedImageUrl] : []
      for (const frameUrl of storyUrls) {
        const isVid = await isVideoDriveUrl(frameUrl)
        const resolved = isVid ? resolveVideoUrl(frameUrl)! : resolveUrl(frameUrl)!
        if (isVid) {
          const res = await publishFacebookVideoStory(client.facebook_page_id, resolved, fbPageToken)
          if (res.post_id) fbPostId = res.post_id
          if (res.error && !fbPostId) fbError = res.error
          continue
        }
        const fbResp = await postForm(`${GRAPH}/${client.facebook_page_id}/photo_stories`, {
          url: resolved,
          access_token: fbPageToken,
        })
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
  if (igPostId) {
    // já publicado numa tentativa anterior — não repete
  } else if (client.instagram_account_id) {
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

  // Guarda o erro real de cada rede — sem isso a causa se perde assim que o
  // status vira "published", e só dava pra investigar durante a própria
  // tentativa (log do Vercel). Update separado e tolerante a falha: se as
  // colunas ainda não existirem no banco (migration_v10 pendente), não pode
  // derrubar a gravação do post_id acima, que é o dado crítico.
  await supabase.from('contents').update({
    facebook_publish_error: fbPostId ? null : fbError,
    instagram_publish_error: igPostId ? null : igError,
  }).eq('id', contentId)

  // Só limpa a cópia re-hospedada quando a publicação saiu COMPLETA em todas
  // as redes esperadas. Se o Instagram (ou o Facebook) falhou, o arquivo fica
  // no Supabase para o retry não depender do download instável do Drive.
  const igExpected = !!client.instagram_account_id
  const fbFullyOk = !!fbPostId && !fbError
  const igFullyOk = !igExpected || (!!igPostId && !igError)
  let cleaned = 0
  if (fbFullyOk && igFullyOk) {
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
