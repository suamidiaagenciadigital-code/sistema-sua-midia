import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function isDriveUrl(url: string) {
  return /drive\.google\.com/.test(url)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { driveUrl, clientId } = await req.json()

  if (!driveUrl || !clientId) {
    return NextResponse.json({ error: 'driveUrl e clientId são obrigatórios' }, { status: 400 })
  }

  if (!isDriveUrl(driveUrl)) {
    return NextResponse.json({ error: 'URL não é do Google Drive' }, { status: 400 })
  }

  const match = driveUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([^/?&]+)/)
  if (!match) return NextResponse.json({ error: 'Não foi possível extrair o ID do arquivo' }, { status: 400 })

  const fileId = match[1]
  const downloadUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`

  let fileResp: Response
  try {
    fileResp = await fetch(downloadUrl)
    if (!fileResp.ok) {
      return NextResponse.json({ error: `Drive retornou ${fileResp.status}. Verifique se o arquivo está público.` }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Não foi possível baixar o arquivo do Drive.' }, { status: 400 })
  }

  const contentTypeHeader = fileResp.headers.get('content-type') ?? 'application/octet-stream'
  const buffer = await fileResp.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  // Detectar tipo real pelo magic bytes (Drive às vezes retorna content-type errado)
  function detectRealType(buf: Uint8Array, declared: string): { mime: string; ext: string } {
    // MP4: bytes 4-7 == 'ftyp' (0x66 0x74 0x79 0x70)
    if (buf.length > 11 && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
      return { mime: 'video/mp4', ext: 'mp4' }
    }
    // MOV: bytes 4-7 == 'ftyp' with 'qt  ' or 'moov'
    if (buf.length > 7 && buf[4] === 0x6D && buf[5] === 0x6F && buf[6] === 0x6F && buf[7] === 0x76) {
      return { mime: 'video/quicktime', ext: 'mov' }
    }
    // WebM: starts with 0x1A 0x45 0xDF 0xA3
    if (buf.length > 3 && buf[0] === 0x1A && buf[1] === 0x45 && buf[2] === 0xDF && buf[3] === 0xA3) {
      return { mime: 'video/webm', ext: 'webm' }
    }
    // JPEG: starts with 0xFF 0xD8 0xFF
    if (buf.length > 2 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) {
      return { mime: 'image/jpeg', ext: 'jpg' }
    }
    // PNG: starts with 0x89 0x50 0x4E 0x47
    if (buf.length > 3 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
      return { mime: 'image/png', ext: 'png' }
    }
    // GIF: starts with 'GIF'
    if (buf.length > 2 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
      return { mime: 'image/gif', ext: 'gif' }
    }
    // Fallback: usar o content-type do header
    const base = declared.split(';')[0].trim()
    const extMap: Record<string, string> = {
      'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
    }
    return { mime: base, ext: extMap[base] ?? (base.startsWith('video/') ? 'mp4' : 'jpg') }
  }

  const { mime, ext } = detectRealType(bytes, contentTypeHeader)
  const path = `${clientId}/drive-${fileId}-${Date.now()}.${ext}`
  const db = createServiceClient()

  const { error: uploadError } = await db.storage
    .from('media')
    .upload(path, bytes, { contentType: mime, upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: `Erro ao salvar no Supabase: ${uploadError.message}` }, { status: 500 })
  }

  const { data: { publicUrl } } = db.storage.from('media').getPublicUrl(path)

  return NextResponse.json({ url: publicUrl, contentType: mime, isVideo: mime.startsWith('video/') })
}
