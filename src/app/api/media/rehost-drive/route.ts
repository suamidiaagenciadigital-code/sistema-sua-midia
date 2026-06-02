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

  const contentType = fileResp.headers.get('content-type') ?? 'application/octet-stream'

  // Detectar extensão a partir do content-type
  const extMap: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
    'video/x-m4v': 'm4v',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  }
  const baseType = contentType.split(';')[0].trim()
  const ext = extMap[baseType] ?? (baseType.startsWith('video/') ? 'mp4' : 'jpg')

  const buffer = await fileResp.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  const path = `${clientId}/drive-${fileId}-${Date.now()}.${ext}`
  const db = createServiceClient()

  const { error: uploadError } = await db.storage
    .from('media')
    .upload(path, bytes, { contentType: baseType, upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: `Erro ao salvar no Supabase: ${uploadError.message}` }, { status: 500 })
  }

  const { data: { publicUrl } } = db.storage.from('media').getPublicUrl(path)

  return NextResponse.json({ url: publicUrl, contentType: baseType })
}
