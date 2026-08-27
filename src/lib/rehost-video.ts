/**
 * rehost-video.ts
 *
 * Detecta URLs de vídeo do Google Drive, baixa o arquivo e re-hospeda no
 * Supabase Storage (bucket "media"), retornando uma URL pública permanente.
 *
 * Isso é necessário porque o Instagram não consegue baixar vídeos do Drive
 * (requer autenticação / múltiplos redirecionamentos).
 */

import { createServiceClient } from '@/lib/supabase/server'

const DRIVE_REGEX = /drive\.google\.com\/(?:file\/d\/|open\?id=)([^/?&]+)/

function extractDriveId(url: string): string | null {
  const match = url.match(DRIVE_REGEX)
  return match ? match[1] : null
}

function isDriveUrl(url: string): boolean {
  return DRIVE_REGEX.test(url)
}

/**
 * Procura uma cópia já existente do mesmo arquivo do Drive.
 *
 * O nome segue `drive-{fileId}-{timestamp}.{ext}`, então o ID identifica o
 * arquivo de origem. Sem essa checagem, colar o mesmo link duas vezes gerava
 * duas cópias de 40MB no bucket.
 */
export async function findExistingRehost(
  clientId: string,
  fileId: string,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<string | null> {
  try {
    const { data } = await supabase.storage
      .from('media')
      .list(clientId, { limit: 100, search: `drive-${fileId}` })

    const hit = data?.find((f) => f.name.startsWith(`drive-${fileId}-`))
    if (!hit) return null

    const { data: pub } = supabase.storage
      .from('media')
      .getPublicUrl(`${clientId}/${hit.name}`)
    return pub.publicUrl
  } catch {
    return null
  }
}

/**
 * Se a URL for do Google Drive e o arquivo for um vídeo,
 * faz o download e re-hospeda no Supabase Storage.
 * Retorna a URL pública do Supabase, ou a URL original em caso de falha.
 */
export async function rehostIfDriveVideo(
  url: string | null | undefined,
  clientId: string,
): Promise<string | null> {
  if (!url) return null
  if (!isDriveUrl(url)) return url

  const fileId = extractDriveId(url)
  if (!fileId) return url

  const supabaseEarly = createServiceClient()

  // Já existe cópia deste arquivo? Evita baixar e gravar 40MB de novo.
  const existing = await findExistingRehost(clientId, fileId, supabaseEarly)
  if (existing) {
    console.log('[rehost-video] Reaproveitando cópia existente:', existing)
    return existing
  }

  try {
    const downloadUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`

    // Verificar Content-Type antes de baixar tudo
    const headResp = await fetch(downloadUrl, { method: 'HEAD' })
    const contentType = headResp.headers.get('content-type') ?? ''

    // Só vídeo precisa de cópia: o Instagram não baixa vídeo do Drive, mas
    // consome imagem via lh3.googleusercontent.com sem problema. Copiar
    // imagem só ocupava storage à toa.
    if (!contentType.startsWith('video/')) {
      return url
    }

    // Baixar o arquivo
    const videoResp = await fetch(downloadUrl)
    if (!videoResp.ok) return url

    const buffer = await videoResp.arrayBuffer()

    // Determinar extensão
    const ext = contentType.split('/')[1]?.split(';')[0]?.trim() ?? 'mp4'
    // O ID do Drive vai no nome para que a limpeza pós-publicação consiga
    // reconstruir a URL original — ver src/lib/cleanup-media.ts
    const path = `${clientId}/drive-${fileId}-${Date.now()}.${ext}`

    // Upload para Supabase Storage
    const supabase = supabaseEarly
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, new Uint8Array(buffer), { contentType })

    if (uploadError) {
      console.error('[rehost-video] Upload error:', uploadError.message)
      return url
    }

    const { data } = supabase.storage.from('media').getPublicUrl(path)
    console.log('[rehost-video] Rehosted:', url, '→', data.publicUrl)
    return data.publicUrl
  } catch (err) {
    console.error('[rehost-video] Error:', err)
    return url // fallback seguro
  }
}

/**
 * Processa um array de URLs — re-hospeda apenas as que forem vídeos do Drive.
 */
export async function rehostMediaUrls(
  urls: string[] | null | undefined,
  clientId: string,
): Promise<string[] | null> {
  if (!urls || urls.length === 0) return urls ?? null
  const rehosted = await Promise.all(
    urls.map((u) => rehostIfDriveVideo(u, clientId)),
  )
  return rehosted.filter(Boolean) as string[]
}
