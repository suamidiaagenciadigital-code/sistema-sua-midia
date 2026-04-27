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
  if (match) return `https://drive.google.com/uc?export=download&id=${match[1]}`
  return url
}

function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return /\.(mp4|mov|avi|webm|m4v)/i.test(url)
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

  // Buscar page token atualizado
  const tokenResp = await fetch(
    `${GRAPH}/${client.facebook_page_id}?fields=access_token&access_token=${client.facebook_page_token}`,
  )
    .then((r) => r.json())
    .catch(() => ({}))
  const pageToken: string = tokenResp.access_token || client.facebook_page_token

  const type = (content.type as string) || 'imagem'
  const isStory = type === 'story'
  const resolvedImageUrl = resolveUrl(content.generated_image_url)
  const mediaUrls: string[] = Array.isArray(content.media_urls)
    ? (content.media_urls as string[]).filter(Boolean)
    : []

  let fbPostId: string | null = null
  let fbError: string | null = null
  let igPostId: string | null = null
  let igError: string | null = null

  // ── Facebook ─────────────────────────────────────────────────────────────
  try {
    if (isStory) {
      const storyUrls =
        mediaUrls.length > 0 ? mediaUrls : resolvedImageUrl ? [resolvedImageUrl] : []
      for (const frameUrl of storyUrls) {
        const isVid = isVideoUrl(frameUrl)
        const resolved = isVid ? resolveVideoUrl(frameUrl)! : resolveUrl(frameUrl)!
        const endpoint = isVid
          ? `${GRAPH}/${client.facebook_page_id}/video_stories`
          : `${GRAPH}/${client.facebook_page_id}/photo_stories`
        const fbResp = await postForm(
          endpoint,
          isVid
            ? { file_url: resolved, access_token: pageToken }
            : { url: resolved, access_token: pageToken },
        )
        if (fbResp.post_id || fbResp.id) fbPostId = fbResp.post_id || fbResp.id
        if (fbResp.error && !fbPostId) fbError = fbResp.error.message
      }
    } else if (type === 'reel') {
      const fbResp = await postForm(`${GRAPH}/${client.facebook_page_id}/videos`, {
        file_url: resolveVideoUrl(content.generated_image_url) ?? '',
        published: 'true',
        description: content.caption ?? '',
        access_token: pageToken,
      })
      fbPostId = fbResp.id ?? null
      fbError = fbResp.error?.message ?? null
    } else if (type === 'carrossel' && mediaUrls.length >= 2) {
      const photoIds: string[] = []
      for (const url of mediaUrls) {
        const photoResp = await postForm(`${GRAPH}/${client.facebook_page_id}/photos`, {
          url: resolveUrl(url) ?? '',
          published: 'false',
          access_token: pageToken,
        })
        if (photoResp.id) photoIds.push(photoResp.id)
      }
      if (photoIds.length >= 1) {
        const fbResp = await postForm(`${GRAPH}/${client.facebook_page_id}/feed`, {
          message: content.caption ?? '',
          attached_media: JSON.stringify(photoIds.map((id) => ({ media_fbid: id }))),
          published: 'true',
          access_token: pageToken,
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
          ? { url: resolvedImageUrl, caption: content.caption ?? '', published: 'true', access_token: pageToken }
          : { message: content.caption ?? '', published: 'true', access_token: pageToken },
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
          video_url: resolveVideoUrl(content.generated_image_url) ?? '',
          caption: content.caption ?? '',
          access_token: pageToken,
        })
        igPostId = res.post_id
        igError = res.error
      } else if (isStory) {
        const storyUrls =
          mediaUrls.length > 0 ? mediaUrls : resolvedImageUrl ? [resolvedImageUrl] : []
        for (const frameUrl of storyUrls) {
          const isVid = isVideoUrl(frameUrl)
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
