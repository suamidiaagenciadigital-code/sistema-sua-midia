import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Chamado pelo flow 2 para buscar conteúdos aprovados da semana
// Body: { clientId, weekStart, weekEnd }
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { clientId, weekStart, weekEnd } = await req.json()

  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, whatsapp_group_jid, approval_token')
    .eq('id', clientId)
    .single()

  if (!client) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  }

  const { data: contents } = await supabase
    .from('contents')
    .select('id, type, title, caption, scheduled_date, media_urls, generated_image_url')
    .eq('client_id', clientId)
    .eq('status', 'approved_by_me')
    .gte('scheduled_date', weekStart)
    .lte('scheduled_date', weekEnd)
    .order('scheduled_date')

  const mapped = (contents ?? []).map(c => ({
    id: c.id,
    type: c.type,
    title: c.title,
    caption: c.caption,
    scheduledDate: c.scheduled_date,
    mediaUrl: c.generated_image_url ?? c.media_urls?.[0] ?? null,
  }))

  return NextResponse.json({
    client,
    groupJid: client.whatsapp_group_jid,
    approvalToken: client.approval_token,
    approvalUrl: `https://sistema-sua-midia.vercel.app/approve/${client.approval_token}`,
    contents: mapped,
  })
}
