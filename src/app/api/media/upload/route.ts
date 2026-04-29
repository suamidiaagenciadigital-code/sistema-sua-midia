import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Aumentar limite de body para uploads de vídeo (100MB)
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Usar service client para contornar RLS no storage
  const supabase = createServiceClient()

  let formData: FormData
  try {
    formData = await req.formData()
  } catch (e: any) {
    return NextResponse.json({ error: 'Arquivo muito grande ou formato inválido: ' + e.message }, { status: 400 })
  }

  const file = formData.get('file') as File
  const clientId = formData.get('clientId') as string
  const tagsRaw = formData.get('tags') as string
  const tags = tagsRaw ? JSON.parse(tagsRaw) : []

  if (!file || !clientId) {
    return NextResponse.json({ error: 'Arquivo e clientId obrigatórios' }, { status: 400 })
  }

  // Determinar tipo
  const mimeType = file.type || 'application/octet-stream'
  let fileType = 'other'
  if (mimeType.startsWith('image/')) fileType = 'image'
  else if (mimeType.startsWith('video/')) fileType = 'video'
  else if (mimeType === 'application/pdf') fileType = 'pdf'

  // Upload para Supabase Storage
  const nameParts = file.name.split('.')
  const ext = nameParts.length > 1 ? nameParts.pop() : 'mp4'
  const path = `${clientId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  let buffer: Uint8Array
  try {
    const arrayBuffer = await file.arrayBuffer()
    buffer = new Uint8Array(arrayBuffer)
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro ao ler arquivo: ' + e.message }, { status: 400 })
  }

  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(path, buffer, { contentType: mimeType, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: 'Storage error: ' + uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)

  // Salvar no banco
  const { data, error } = await supabase.from('media').insert({
    client_id: clientId,
    file_url: publicUrl,
    file_type: fileType,
    tags,
    original_name: file.name,
    size_bytes: file.size,
  }).select('id, file_url').single()

  if (error) {
    // Retornar a URL mesmo se falhar ao salvar no banco
    return NextResponse.json({ id: null, file_url: publicUrl })
  }

  return NextResponse.json(data)
}
