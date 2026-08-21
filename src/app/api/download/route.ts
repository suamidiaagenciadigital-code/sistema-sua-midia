import { NextRequest, NextResponse } from 'next/server'

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

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url obrigatória' }, { status: 400 })

  if (!isAllowedHost(url)) {
    return NextResponse.json({ error: 'Origem não permitida' }, { status: 400 })
  }

  // Converter Drive para URL direta sem necessidade de autenticação
  let fetchUrl = url
  const driveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|uc\?.*id=)([^/?&]+)/)
  if (driveMatch) {
    fetchUrl = `https://lh3.googleusercontent.com/d/${driveMatch[1]}`
  }

  try {
    const resp = await fetch(fetchUrl, { redirect: 'follow' })
    if (!resp.ok) return NextResponse.json({ error: 'Falha ao baixar arquivo' }, { status: 502 })

    const contentType = resp.headers.get('content-type') ?? 'application/octet-stream'

    // Se o servidor retornou HTML (ex: página de login do Google), o arquivo não está público
    if (contentType.includes('text/html')) {
      return NextResponse.json(
        { error: 'Arquivo não está público no Google Drive. Compartilhe como "qualquer pessoa com o link".' },
        { status: 403 },
      )
    }

    const buffer = await resp.arrayBuffer()

    const ext = contentType.includes('png') ? 'png'
      : contentType.includes('webp') ? 'webp'
      : contentType.includes('gif') ? 'gif'
      : contentType.includes('mp4') ? 'mp4'
      : contentType.includes('mov') ? 'mov'
      : contentType.includes('webm') ? 'webm'
      : 'jpg'

    const filename = `suamidia-${Date.now()}.${ext}`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
