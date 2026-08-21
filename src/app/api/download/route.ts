import { NextRequest, NextResponse } from 'next/server'

// Vídeos podem ser grandes — dá margem para o proxy transferir o arquivo
export const maxDuration = 60

// Rota é pública (ver src/proxy.ts): restringe hosts para não virar proxy aberto
const ALLOWED_HOSTS = [
  'drive.google.com',
  'lh3.googleusercontent.com',
  'drive.usercontent.google.com',
]

function isAllowedHost(rawUrl: string): boolean {
  try {
    const { protocol, hostname } = new URL(rawUrl)
    if (protocol !== 'https:') return false
    return ALLOWED_HOSTS.includes(hostname) || hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}

// Ordem de tentativa para arquivos do Drive:
// 1) usercontent → devolve o arquivo original (vídeo ou imagem)
// 2) lh3 → CDN de imagem, usado como fallback
function candidateUrls(url: string): string[] {
  const driveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*id=)([^/?&]+)/)
  if (!driveMatch) return [url]
  const id = driveMatch[1]
  return [
    `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`,
    `https://lh3.googleusercontent.com/d/${id}`,
  ]
}

const MIME_BY_EXT: Record<string, string> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
  webm: 'video/webm',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
}

// O Drive responde application/octet-stream, mas manda o nome real
// em Content-Disposition — é dali que sai a extensão confiável.
function extFromDisposition(disposition: string): string | null {
  const name = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)?.[1]
  const ext = name?.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase()
  return ext && ext in MIME_BY_EXT ? ext : null
}

function extFromContentType(contentType: string): string | null {
  const ct = contentType.toLowerCase()
  if (ct.includes('quicktime')) return 'mov'
  if (ct.includes('mp4')) return 'mp4'
  if (ct.includes('webm')) return 'webm'
  if (ct.includes('m4v')) return 'm4v'
  if (ct.includes('png')) return 'png'
  if (ct.includes('webp')) return 'webp'
  if (ct.includes('gif')) return 'gif'
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg'
  if (ct.startsWith('video/')) return 'mp4'
  if (ct.startsWith('image/')) return 'jpg'
  return null
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url obrigatória' }, { status: 400 })

  if (!isAllowedHost(url)) {
    return NextResponse.json({ error: 'Origem não permitida' }, { status: 400 })
  }

  try {
    for (const fetchUrl of candidateUrls(url)) {
      const resp = await fetch(fetchUrl, { redirect: 'follow' })
      if (!resp.ok || !resp.body) continue

      const upstreamType = resp.headers.get('content-type') ?? ''
      // HTML = página de login/erro do Google: arquivo não está público
      if (upstreamType.includes('text/html')) continue

      const upstreamDisposition = resp.headers.get('content-disposition') ?? ''
      const ext =
        extFromDisposition(upstreamDisposition) ??
        extFromContentType(upstreamType) ??
        'jpg'

      const headers: Record<string, string> = {
        'Content-Type': MIME_BY_EXT[ext] ?? 'application/octet-stream',
        'Content-Disposition': `attachment; filename="suamidia-${Date.now()}.${ext}"`,
        'Cache-Control': 'no-store',
      }
      const length = resp.headers.get('content-length')
      if (length) headers['Content-Length'] = length

      // Repassa em streaming para não carregar o arquivo inteiro na memória
      return new NextResponse(resp.body, { headers })
    }

    return NextResponse.json(
      { error: 'Arquivo não está público no Google Drive. Compartilhe como "qualquer pessoa com o link".' },
      { status: 403 },
    )
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
