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

  try {
    const downloadUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`

    // Verificar Content-Type antes de baixar tudo
    const headResp = await fetch(downloadUrl, { method: 'HEAD' })
    const contentType = headResp.headers.get('content-type') ?? ''

    if (!contentType.startsWith('video/')) {
      // Não é vídeo — não precisa re-hospedar
      return url
    }

    // Baixar o vídeo
    const videoResp = await fetch(downloadUrl)
    if (!videoResp.ok) return url

    const buffer = await videoResp.arrayBuffer()

    // Determinar extensão
    const ext = contentType.split('/')[1]?.split(';')[0]?.trim() ?? 'mp4'
    const path = `${clientId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    // Upload para Supabase Storage
    const supabase = createServiceClient()
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
