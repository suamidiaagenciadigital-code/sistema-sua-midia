'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { rehostIfDriveVideo, rehostMediaUrls } from '@/lib/rehost-video'

export async function updateContentAction(clientId: string, contentId: string, formData: FormData) {
  const supabase = await createClient()

  const type = formData.get('type') as string | null

  // Carousel/Story: parse textarea de URLs (uma por linha)
  const mediaUrlsText = formData.get('media_urls_text') as string | null
  const rawMediaUrls = mediaUrlsText
    ? mediaUrlsText.split('\n').map(u => u.trim()).filter(Boolean)
    : null

  // Re-hospedar vídeos do Drive no Supabase Storage
  const rawGeneratedImageUrl = formData.get('generated_image_url') as string | null
  const generatedImageUrl = type === 'reel'
    ? await rehostIfDriveVideo(rawGeneratedImageUrl, clientId)
    : rawGeneratedImageUrl || null

  const mediaUrls = (type === 'story' || type === 'carrossel')
    ? await rehostMediaUrls(rawMediaUrls, clientId)
    : rawMediaUrls

  // Cenas do Reel (JSON)
  const reelScenesRaw = formData.get('reel_scenes_json') as string | null
  let reelScenes = null
  if (reelScenesRaw) {
    try {
      const parsed = JSON.parse(reelScenesRaw)
      reelScenes = Array.isArray(parsed) && parsed.length > 0 ? parsed : null
    } catch { /* ignora JSON inválido */ }
  }

  // Cards do Carrossel (JSON)
  const carouselCardsRaw = formData.get('carousel_cards_json') as string | null
  let carouselCards = null
  if (carouselCardsRaw) {
    try {
      const parsed = JSON.parse(carouselCardsRaw)
      carouselCards = Array.isArray(parsed) && parsed.length > 0 ? parsed : null
    } catch { /* ignora JSON inválido */ }
  }

  await supabase.from('contents').update({
    title: formData.get('title') as string,
    caption: formData.get('caption') as string,
    script: formData.get('script') as string || null,
    image_prompt: formData.get('image_prompt') as string || null,
    generated_image_url: generatedImageUrl,
    media_urls: mediaUrls && mediaUrls.length > 0 ? mediaUrls : null,
    reel_scenes: reelScenes,
    carousel_cards: carouselCards,
    cta: formData.get('cta') as string || null,
    partner_mentioned: formData.get('partner_mentioned') as string || null,
    scheduled_date: formData.get('scheduled_date') as string || null,
    scheduled_time: formData.get('scheduled_time') as string || null,
    revision_notes: formData.get('revision_notes') as string || null,
  }).eq('id', contentId)

  revalidatePath(`/clients/${clientId}/content/${contentId}`)
}

export async function updateStatusAction(clientId: string, contentId: string, status: string, revisionNotes?: string) {
  const supabase = await createClient()

  const update: Record<string, unknown> = { status }
  if (revisionNotes) update.revision_notes = revisionNotes
  if (status === 'sent_to_client') update.requires_client_approval = true
  if (status === 'revision') {
    const { data } = await supabase.from('contents').select('revision_count').eq('id', contentId).single()
    update.revision_count = (data?.revision_count ?? 0) + 1
  }

  await supabase.from('contents').update(update).eq('id', contentId)
  revalidatePath(`/clients/${clientId}/content/${contentId}`)
  revalidatePath(`/approvals`)
}

export async function deleteContentAction(clientId: string, contentId: string) {
  const supabase = await createClient()
  await supabase.from('contents').delete().eq('id', contentId)
  redirect(`/clients/${clientId}/calendar`)
}
