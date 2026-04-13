import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Chamado pelo flow 3 quando cliente clica em Aprovar
// Body: { contentId, status }
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { contentId, status } = await req.json()

  const supabase = await createClient()

  await supabase
    .from('contents')
    .update({ status })
    .eq('id', contentId)

  return NextResponse.json({ ok: true })
}
