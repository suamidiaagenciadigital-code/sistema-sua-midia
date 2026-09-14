/**
 * rehost-video.ts
 *
 * Detecta URLs de vídeo OU imagem do Google Drive, baixa o arquivo e
 * re-hospeda no Supabase Storage (bucket "media"), retornando uma URL
 * pública permanente.
 *
 * Vídeo sempre precisou disso (Instagram não baixa vídeo do Drive direto).
 * Imagem foi adicionada depois: o lh3.googleusercontent.com geralmente
 * funciona, mas o Meta às vezes não consegue buscar de lá ("Missing or
 * invalid image file" / "Only photo or video can be accepted as media
 * type"), mesmo a URL abrindo normal no navegador — ver publish-now/route.ts.
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
 * Se a URL for do Google Drive e o arquivo for vídeo OU imagem, faz o
 * download e re-hospeda no Supabase Storage. Retorna a URL pública do
 * Supabase, ou a URL original em caso de falha (fallback seguro — quem
 * chama ainda pode cair pro lh3.googleusercontent.com).
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

  // Já existe cópia deste arquivo? Evita baixar e gravar de novo.
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
    const isVideo = contentType.startsWith('video/')
    const isImage = contentType.startsWith('image/')

    if (!isVideo && !isImage) {
      return url
    }

    // Baixar o arquivo
    const fileResp = await fetch(downloadUrl, { signal: AbortSignal.timeout(120_000) })
    if (!fileResp.ok) return url

    // A resposta do GET pode diferir do HEAD (página HTML de verificação do
    // Drive sob rate limit) — revalida.
    const getType = fileResp.headers.get('content-type') ?? ''
    if (!getType.startsWith('video/') && !getType.startsWith('image/') && !getType.startsWith('application/octet-stream')) {
      return url
    }

    const expectedLen = Number(fileResp.headers.get('content-length') || 0)
    const buffer = await fileResp.arrayBuffer()
    // Download truncado ou pequeno demais: não sobe arquivo corrompido.
    if (expectedLen > 0 && buffer.byteLength < expectedLen * 0.98) return url
    if (buffer.byteLength < (isImage ? 2_000 : 50_000)) return url

    let ext: string
    let uploadContentType: string
    if (isVideo) {
      ext = contentType.includes('quicktime') ? 'mov' : 'mp4'
      uploadContentType = ext === 'mov' ? 'video/quicktime' : 'video/mp4'
    } else {
      ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : contentType.includes('gif') ? 'gif' : 'jpg'
      uploadContentType = contentType.startsWith('image/') ? contentType : `image/${ext}`
    }
    // O ID do Drive vai no nome para que a limpeza pós-publicação consiga
    // reconstruir a URL original — ver src/lib/cleanup-media.ts
    const path = `${clientId}/drive-${fileId}-${Date.now()}.${ext}`

    // Upload para Supabase Storage
    const supabase = supabaseEarly
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, new Uint8Array(buffer), { contentType: uploadContentType })

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
