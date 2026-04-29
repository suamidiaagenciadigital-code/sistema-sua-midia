import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const formData = await req.formData()

  const file = formData.get('file') as File
  const clientId = formData.get('clientId') as string
  const tagsRaw = formData.get('tags') as string
  const tags = tagsRaw ? JSON.parse(tagsRaw) : []

  if (!file || !clientId) {
    return NextResponse.json({ error: 'Arquivo e clientId obrigatórios' }, { status: 400 })
  }

  // Determinar tipo
  const mimeType = file.type
  let fileType = 'other'
  if (mimeType.startsWith('image/')) fileType = 'image'
  else if (mimeType.startsWith('video/')) fileType = 'video'
  else if (mimeType === 'application/pdf') fileType = 'pdf'

  // Upload para Supabase Storage
  const ext = file.name.split('.').pop()
  const path = `${clientId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(path, buffer, { contentType: mimeType })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
