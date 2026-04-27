import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: contentId } = await params
  const supabase = createServiceClient()

  // Buscar conteúdo
  const { data: content } = await supabase
    .from('contents')
    .select('id, client_id, type')
    .eq('id', contentId)
    .single()

  if (!content) {
    return NextResponse.json({ error: 'Conteúdo não encontrado' }, { status: 404 })
  }

  // Buscar dados do cliente
  const { data: client } = await supabase
    .from('clients')
    .select('facebook_page_id, facebook_page_token')
    .eq('id', content.client_id)
    .single()

  if (!client?.facebook_page_id || !client?.facebook_page_token) {
    return NextResponse.json({ error: 'Integrações Meta não configuradas para este cliente' }, { status: 400 })
  }

  // Marcar como 'publishing' — o n8n detecta e publica em até 1 minuto
  const { error: updateError } = await supabase
    .from('contents')
    .update({ status: 'publishing' })
    .eq('id', contentId)

  if (updateError) {
    return NextResponse.json({ error: 'Erro ao enfileirar publicação' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, social: { queued: true } })
}
