import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { contentId, token, status, revisionNotes } = await req.json()

  if (!['approved_by_client', 'revision'].includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Verificar que o token pertence ao cliente dono do conteúdo
  const { data: content } = await supabase
    .from('contents')
    .select('id, client_id, status')
    .eq('id', contentId)
    .single()

  if (!content || content.status !== 'sent_to_client') {
    return NextResponse.json({ error: 'Conteúdo não encontrado ou já processado' }, { status: 404 })
  }

  const { data: client } = await supabase
    .from('clients')
    .select('approval_token')
    .eq('id', content.client_id)
    .single()

  if (!client || client.approval_token !== token) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 403 })
  }

  const update: Record<string, unknown> = { status }
  if (revisionNotes) {
    update.revision_notes = revisionNotes
    const { data: current } = await supabase.from('contents').select('revision_count').eq('id', contentId).single()
    update.revision_count = (current?.revision_count ?? 0) + 1
  }

  await supabase.from('contents').update(update).eq('id', contentId)

  return NextResponse.json({ ok: true })
}
