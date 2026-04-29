import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Registra metadados de um arquivo já enviado direto ao Supabase Storage pelo browser
export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()

  const { clientId, file_url, file_type, original_name, size_bytes, tags } = body

  if (!clientId || !file_url) {
    return NextResponse.json({ error: 'clientId e file_url obrigatórios' }, { status: 400 })
  }

  const { data, error } = await supabase.from('media').insert({
    client_id: clientId,
    file_url,
    file_type: file_type ?? 'video',
    tags: tags ?? [],
    original_name: original_name ?? 'video',
    size_bytes: size_bytes ?? 0,
  }).select('id, file_url').single()

  if (error) {
    // Não falhar se o banco der erro — a URL já está no storage
    return NextResponse.json({ id: null, file_url })
  }

  return NextResponse.json(data)
}
