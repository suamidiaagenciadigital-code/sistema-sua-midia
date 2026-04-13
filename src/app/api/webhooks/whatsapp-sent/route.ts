import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Chamado pelo n8n após envio de mensagem WhatsApp confirmado
// Body esperado: { ticket_id: string, sent_at?: string }
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { ticket_id } = await req.json()

  if (!ticket_id) {
    return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 })
  }

  const supabase = await createClient()

  await supabase
    .from('support_tickets')
    .update({ status: 'responded' })
    .eq('id', ticket_id)
    .eq('status', 'open') // só atualiza se ainda aberto

  return NextResponse.json({ ok: true })
}
