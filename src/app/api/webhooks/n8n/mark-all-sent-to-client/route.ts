import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Chamado pelo flow 2 após enviar o link de aprovação
// Marca todos os conteúdos da semana como sent_to_client em uma só chamada
// Body: { clientId, weekStart, weekEnd }
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { clientId, weekStart, weekEnd } = await req.json()

  const supabase = await createClient()

  // requires_client_approval é obrigatório: sem ele o story não aparece na
  // página de aprovação do cliente (ver src/app/approve/[token]/page.tsx)
  const { count } = await supabase
    .from('contents')
    .update({ status: 'sent_to_client', requires_client_approval: true })
    .eq('client_id', clientId)
    .eq('status', 'approved_by_me')
    .gte('scheduled_date', weekStart)
    .lte('scheduled_date', weekEnd)

  return NextResponse.json({ ok: true, updated: count ?? 0 })
}
