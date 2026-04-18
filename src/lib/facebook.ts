/**
 * Integração com Meta Graph API — Facebook & Instagram Business
 *
 * Facebook:  POST /{page-id}/photos  (imagem) | /{page-id}/feed (texto)
 * Instagram: POST /{ig-user-id}/media → /{ig-user-id}/media_publish
 *
 * Docs:
 *   https://developers.facebook.com/docs/graph-api/reference/page/photos/
 *   https://developers.facebook.com/docs/instagram-api/reference/ig-user/media
 *   https://developers.facebook.com/docs/instagram-api/reference/ig-user/media_publish
 */

const GRAPH = 'https://graph.facebook.com/v21.0'

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Converte URL do Google Drive para URL de imagem direta (pública).
 * Drive com permissão "qualquer pessoa com o link" funciona assim:
 *   https://drive.google.com/file/d/FILE_ID/view  →  https://lh3.googleusercontent.com/d/FILE_ID
 */
function resolvePublicImageUrl(url: string | null): string | null {
  if (!url) return null
  const match = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([^/?&]+)/)
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`
  return url
}

/**
 * Converte data 'YYYY-MM-DD' + hora 'HH:MM' para Unix timestamp UTC.
 * O sistema usa horário de Brasília (UTC-3).
 */
function toUtcTimestamp(date: string, time = '09:00'): number {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  // Cria Date como local (sistema pode estar em qualquer fuso) → força UTC-3
  const localMs = Date.UTC(year!, month! - 1, day!, hour! + 3, minute!, 0)
  return Math.floor(localMs / 1000)
}

// ── Tipos ─────────────────────────────────────────────────────────────────

export interface SocialScheduleResult {
  facebook: { post_id: string | null; error: string | null }
  instagram: { post_id: string | null; error: string | null }
}

interface ScheduleParams {
  pageId: string
  pageToken: string
  instagramAccountId?: string | null
  caption: string
  imageUrl: string | null        // URL original (pode ser Google Drive)
  scheduledDate: string          // 'YYYY-MM-DD'
  scheduledTime?: string         // 'HH:MM', padrão '09:00'
}

// ── Facebook ───────────────────────────────────────────────────────────────

async function scheduleFacebook(params: {
  pageId: string
  pageToken: string
  caption: string
  imageUrl: string | null
  scheduledTimestamp: number
}): Promise<{ post_id: string | null; error: string | null }> {
  const { pageId, pageToken, caption, imageUrl, scheduledTimestamp } = params

  const body = new URLSearchParams({
    published: 'false',
    scheduled_publish_time: String(scheduledTimestamp),
    access_token: pageToken,
  })

  const endpoint = imageUrl
    ? `${GRAPH}/${pageId}/photos`
    : `${GRAPH}/${pageId}/feed`

  if (imageUrl) {
    body.append('url', imageUrl)
    body.append('caption', caption)
  } else {
    body.append('message', caption)
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    const data = await res.json() as { id?: string; error?: { message: string } }

    if (!res.ok || data.error) {
      return { post_id: null, error: data.error?.message ?? 'Erro desconhecido (Facebook)' }
    }
    return { post_id: data.id ?? null, error: null }
  } catch (err) {
    return { post_id: null, error: `Falha na requisição ao Facebook: ${(err as Error).message}` }
  }
}

// ── Instagram ──────────────────────────────────────────────────────────────

async function scheduleInstagram(params: {
  igAccountId: string
  pageToken: string
  caption: string
  imageUrl: string               // OBRIGATÓRIO para Instagram
  scheduledTimestamp: number
}): Promise<{ post_id: string | null; error: string | null }> {
  const { igAccountId, pageToken, caption, imageUrl, scheduledTimestamp } = params

  try {
    // Etapa 1: Criar container de mídia
    const containerBody = new URLSearchParams({
      image_url: imageUrl,
      caption,
      published: 'false',
      scheduled_publish_time: String(scheduledTimestamp),
      access_token: pageToken,
    })

    const containerRes = await fetch(`${GRAPH}/${igAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: containerBody.toString(),
    })
    const containerData = await containerRes.json() as { id?: string; error?: { message: string } }

    if (!containerRes.ok || containerData.error) {
      return { post_id: null, error: containerData.error?.message ?? 'Erro ao criar container (Instagram)' }
    }

    const creationId = containerData.id
    if (!creationId) {
      return { post_id: null, error: 'Instagram não retornou creation_id' }
    }

    // Etapa 2: Publicar o container (o agendamento fica no campo scheduled_publish_time)
    const publishBody = new URLSearchParams({
      creation_id: creationId,
      access_token: pageToken,
    })

    const publishRes = await fetch(`${GRAPH}/${igAccountId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: publishBody.toString(),
    })
    const publishData = await publishRes.json() as { id?: string; error?: { message: string } }

    if (!publishRes.ok || publishData.error) {
      return { post_id: null, error: publishData.error?.message ?? 'Erro ao publicar container (Instagram)' }
    }

    return { post_id: publishData.id ?? creationId, error: null }
  } catch (err) {
    return { post_id: null, error: `Falha na requisição ao Instagram: ${(err as Error).message}` }
  }
}

// ── Função principal ───────────────────────────────────────────────────────

/**
 * Agenda um conteúdo no Facebook e/ou Instagram quando o cliente aprova.
 * - Instagram só é chamado se `instagramAccountId` estiver preenchido E houver imagem.
 * - Falhas individuais não bloqueam a outra plataforma.
 */
export async function scheduleOnSocialMedia(params: ScheduleParams): Promise<SocialScheduleResult> {
  const {
    pageId,
    pageToken,
    instagramAccountId,
    caption,
    imageUrl: rawImageUrl,
    scheduledDate,
    scheduledTime = '09:00',
  } = params

  const scheduledTimestamp = toUtcTimestamp(scheduledDate, scheduledTime)
  const now = Math.floor(Date.now() / 1000)

  // A Meta exige que o agendamento seja pelo menos 10 min no futuro
  if (scheduledTimestamp < now + 600) {
    const msg = 'Data de agendamento deve ser pelo menos 10 minutos no futuro — post não agendado'
    return {
      facebook: { post_id: null, error: msg },
      instagram: { post_id: null, error: msg },
    }
  }

  // Resolver URL pública (converte Google Drive se necessário)
  const publicImageUrl = resolvePublicImageUrl(rawImageUrl)

  // Executar em paralelo
  const [fbResult, igResult] = await Promise.all([
    scheduleFacebook({
      pageId,
      pageToken,
      caption,
      imageUrl: publicImageUrl,
      scheduledTimestamp,
    }),
    instagramAccountId && publicImageUrl
      ? scheduleInstagram({
          igAccountId: instagramAccountId,
          pageToken,
          caption,
          imageUrl: publicImageUrl,
          scheduledTimestamp,
        })
      : Promise.resolve({
          post_id: null,
          error: instagramAccountId
            ? 'Instagram requer imagem — post não agendado'
            : null, // sem conta configurada, silêncio
        }),
  ])

  return { facebook: fbResult, instagram: igResult }
}
