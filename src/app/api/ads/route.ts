import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { clientId, objective, budget, period, strategy, copies, audience_suggestion } = await req.json()

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ad_campaigns')
    .insert({
      client_id: clientId,
      objective,
      budget,
      period,
      strategy,
      copies,
      audience_suggestion,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
