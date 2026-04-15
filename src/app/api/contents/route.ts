import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('contents')
    .insert({
      client_id: body.client_id,
      type: body.type,
      title: body.title,
      caption: body.caption,
      script: body.script || null,
      image_prompt: body.image_prompt || null,
      cta: body.cta || null,
      partner_mentioned: body.partner_mentioned || null,
      scheduled_date: body.scheduled_date || null,
      status: body.status || 'draft',
      reel_scenes: body.reel_scenes ?? null,
      carousel_cards: body.carousel_cards ?? null,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
