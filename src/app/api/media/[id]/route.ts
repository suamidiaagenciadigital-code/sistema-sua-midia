import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: file } = await supabase.from('media').select('file_url, client_id').eq('id', id).single()
  if (!file) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  // Extrair path do storage a partir da URL pública
  const url = new URL(file.file_url)
  const storagePath = url.pathname.split('/storage/v1/object/public/media/')[1]
  if (storagePath) {
    await supabase.storage.from('media').remove([storagePath])
  }

  await supabase.from('media').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
