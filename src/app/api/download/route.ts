import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url obrigatória' }, { status: 400 })

  // Converter Drive para URL direta sem necessidade de autenticação
  let fetchUrl = url
  const driveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|uc\?.*id=)([^/?&]+)/)
  if (driveMatch) {
    fetchUrl = `https://lh3.googleusercontent.com/d/${driveMatch[1]}`
  }

  try {
    const resp = await fetch(fetchUrl)
    if (!resp.ok) return NextResponse.json({ error: 'Falha ao baixar arquivo' }, { status: 502 })

    const contentType = resp.headers.get('content-type') ?? 'application/octet-stream'
    const buffer = await resp.arrayBuffer()

    // Detectar extensão pelo content-type
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
