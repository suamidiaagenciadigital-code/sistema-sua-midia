import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Chamado pelo flow 2 após envio de cada conteúdo no WhatsApp
// Body: { contentId }
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { contentId } = await req.json()

  const supabase = await createClient()

  await supabase
    .from('contents')
    .update({ status: 'sent_to_client' })
    .eq('id', contentId)
    .eq('status', 'approved_by_me') // só muda se ainda estiver approved_by_me

  return NextResponse.json({ ok: true })
}
