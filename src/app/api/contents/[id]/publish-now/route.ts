import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

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
  return /\.(mp4|mov|avi|webm|m4v)/i.test(url)
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
    const downloadUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`

    const videoResp = await fetch(downloadUrl)
    if (!videoResp.ok) return driveUrl

    const contentType = videoResp.headers.get('content-type') ?? 'video/mp4'
    if (!contentType.startsWith('video/')) return driveUrl

    const buffer = await videoResp.arrayBuffer()
    const ext = contentType.split('/')[1]?.split(';')[0]?.trim() ?? 'mp4'
    const path = `${clientId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

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
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: contentId } = await params
  const supabase = createServiceClient()

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

  if (!client?.facebook_page_id || !client?.facebook_page_token) {
    return NextResponse.json(
      { error: 'Integrações Meta não configuradas para este cliente' },
      { status: 400 },
    )
  }

  // System User Token — não expira, não precisa de aprovação do app Meta
  const pageToken: string = 'EAAU7TJPfNhABRWZBZBoG8ZBcvD0Mh46CeyOjfSEXk9vMxqSZANTZB78FtzxbDgT6QjjjFFRnJFsrsKBE9oQwl53emkTELkbclUrFgKKYT8ZANEDluKhCc83Wk68QUrpYJi12jUqtZBp8DhfIsUbKY7X2n0SQJ3BLoZAojN4oP3KLy5owgRBuwMBUkcxrTzqclAZDZD'

  const type = (content.type as string) || 'imagem'
  const isStory = type === 'story'

  // Re-hospedar vídeo do Drive no Supabase antes de publicar (necessário para Instagram)
  let generatedImageUrl = content.generated_image_url as string | null
  if ((type === 'reel') && isDriveUrl(generatedImageUrl)) {
    generatedImageUrl = await rehostDriveVideoForPublish(generatedImageUrl!, content.client_id, supabase)
  }

  const resolvedImageUrl = resolveUrl(generatedImageUrl)
  const mediaUrls: string[] = Array.isArray(content.media_urls)
    ? (content.media_urls as string[]).filter(Boolean)
    : []

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
      fbError = fbResp.error?.message ?? null
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
    const igId = client.instagram_account_id

    const igCreateAndPublish = async (containerParams: Record<string, string>) => {
      const container = await postForm(`${GRAPH}/${igId}/media`, containerParams)
      if (container.error) return { post_id: null as string | null, error: container.error.message as string }
      if (!container.id) return { post_id: null, error: 'Instagram não retornou creation_id' }

      // Aguardar container ficar FINISHED (Instagram precisa processar a mídia)
      for (let t = 0; t < 20; t++) {
        const st = await fetch(`${GRAPH}/${container.id}?fields=status_code&access_token=${pageToken}`)
          .then((r) => r.json()).catch(() => ({}))
        if (st.status_code === 'FINISHED') break
        if (st.status_code === 'ERROR') return { post_id: null, error: 'IG media error: ' + JSON.stringify(st) }
        await new Promise((r) => setTimeout(r, 2000))
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
          video_url: generatedImageUrl ?? '',  // já rehospedado no Supabase
          caption: content.caption ?? '',
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

  return NextResponse.json({
    ok: true,
    facebook: { post_id: fbPostId, error: fbError },
    instagram: { post_id: igPostId, error: igError },
  })
}
