import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Chamado pelo flow 1 para identificar o cliente pelo JID do grupo no WhatsApp
// Body: { groupJid: string }
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { groupJid } = await req.json()

  if (!groupJid) {
    return NextResponse.json({ found: false })
  }

  const supabase = await createClient()

  // Busca pelo whatsapp_group_jid salvo no perfil do cliente
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, niche, tone_of_voice, contracted_services, ai_notes, whatsapp_group_jid')
    .eq('status', 'ativo')

  const client = clients?.find(c => c.whatsapp_group_jid === groupJid)

  if (!client) {
    return NextResponse.json({ found: false })
  }

  return NextResponse.json({ found: true, client })
}
