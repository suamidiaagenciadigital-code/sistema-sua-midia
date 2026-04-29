import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Gera uma URL assinada para upload direto do browser ao Supabase Storage
// Isso permite enviar arquivos grandes sem passar pelo Vercel (sem limite de 4.5MB)
export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const { clientId, fileName, contentType } = await req.json()

  if (!clientId || !fileName) {
    return NextResponse.json({ error: 'clientId e fileName obrigatórios' }, { status: 400 })
  }

  const ext = fileName.split('.').pop() ?? 'mp4'
  const path = `${clientId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from('media')
    .createSignedUploadUrl(path)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Retornar a URL assinada e o path para o cliente usar
  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path,
    publicUrl,
  })
}
