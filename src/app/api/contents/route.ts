import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rehostIfDriveVideo, rehostMediaUrls } from '@/lib/rehost-video'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()

  const clientId: string = body.client_id
  const type: string = body.type

  // Re-hospedar vídeos do Drive no Supabase Storage (necessário para Instagram)
  const isVideoContent = type === 'reel'
  const isStoryOrCarousel = type === 'story' || type === 'carrossel'

  const generatedImageUrl = isVideoContent
    ? await rehostIfDriveVideo(body.generated_image_url, clientId)
    : (body.generated_image_url || null)

  const mediaUrls = isStoryOrCarousel
    ? await rehostMediaUrls(body.media_urls, clientId)
    : (body.media_urls ?? null)

  const { data, error } = await supabase
    .from('contents')
    .insert({
      client_id: clientId,
      type,
      title: body.title,
      caption: body.caption,
      script: body.script || null,
      image_prompt: body.image_prompt || null,
      cta: body.cta || null,
      partner_mentioned: body.partner_mentioned || null,
      scheduled_date: body.scheduled_date || null,
      scheduled_time: body.scheduled_time || null,
      status: body.status || 'pending_my_approval',
      generated_image_url: generatedImageUrl,
      media_urls: mediaUrls,
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
