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

function extFor(contentType: string): string {
  if (contentType.includes('mp4')) return 'mp4'
  if (contentType.includes('quicktime') || contentType.includes('mov')) return 'mov'
  if (contentType.includes('webm')) return 'webm'
  if (contentType.includes('x-m4v') || contentType.includes('m4v')) return 'm4v'
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('gif')) return 'gif'
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg'
  if (contentType.startsWith('video/')) return 'mp4'
  return 'jpg'
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
      if (!resp.ok) continue

      const contentType = resp.headers.get('content-type') ?? ''
      // HTML = página de login/erro do Google: arquivo não está público
      if (contentType.includes('text/html')) continue

      const buffer = await resp.arrayBuffer()
      const ext = extFor(contentType)
      const filename = `suamidia-${Date.now()}.${ext}`

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    return NextResponse.json(
      { error: 'Arquivo não está público no Google Drive. Compartilhe como "qualquer pessoa com o link".' },
      { status: 403 },
    )
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
