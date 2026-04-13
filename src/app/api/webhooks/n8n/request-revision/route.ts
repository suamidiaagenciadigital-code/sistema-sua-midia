import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Chamado pelo flow 3 quando cliente escreve a correção
// Body: { contentId, revisionNotes, status }
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { contentId, revisionNotes, status } = await req.json()

  const supabase = await createClient()

  // Buscar revision_count atual
  const { data: current } = await supabase
    .from('contents')
    .select('revision_count')
    .eq('id', contentId)
    .single()

  await supabase
    .from('contents')
    .update({
      status,
      revision_notes: revisionNotes,
      revision_count: (current?.revision_count ?? 0) + 1,
    })
    .eq('id', contentId)

  return NextResponse.json({ ok: true })
}
