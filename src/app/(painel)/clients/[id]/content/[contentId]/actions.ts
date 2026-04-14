'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updateContentAction(clientId: string, contentId: string, formData: FormData) {
  const supabase = await createClient()

  // Carousel: parse textarea de URLs (uma por linha)
  const mediaUrlsText = formData.get('media_urls_text') as string | null
  const mediaUrls = mediaUrlsText
    ? mediaUrlsText.split('\n').map(u => u.trim()).filter(Boolean)
    : null

  await supabase.from('contents').update({
    title: formData.get('title') as string,
    caption: formData.get('caption') as string,
    script: formData.get('script') as string || null,
    image_prompt: formData.get('image_prompt') as string || null,
    generated_image_url: formData.get('generated_image_url') as string || null,
    media_urls: mediaUrls && mediaUrls.length > 0 ? mediaUrls : null,
    cta: formData.get('cta') as string || null,
    partner_mentioned: formData.get('partner_mentioned') as string || null,
    scheduled_date: formData.get('scheduled_date') as string || null,
    revision_notes: formData.get('revision_notes') as string || null,
  }).eq('id', contentId)

  revalidatePath(`/clients/${clientId}/content/${contentId}`)
}

export async function updateStatusAction(clientId: string, contentId: string, status: string, revisionNotes?: string) {
  const supabase = await createClient()

  const update: Record<string, unknown> = { status }
  if (revisionNotes) update.revision_notes = revisionNotes
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
