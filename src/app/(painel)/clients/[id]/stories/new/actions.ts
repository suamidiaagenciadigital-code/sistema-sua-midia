'use server'

import { createClient } from '@/lib/supabase/server'
import { scheduleStory } from '@/lib/facebook'
import { getMetaToken } from '@/lib/meta-token'
import { redirect } from 'next/navigation'

export async function createStoryAction(clientId: string, formData: FormData) {
  const supabase = await createClient()

  const mediaUrl    = (formData.get('media_url') as string | null)?.trim() ?? ''
  const mediaType   = (formData.get('media_type') as string) === 'video' ? 'video' : 'image'
  const scheduledDate = formData.get('scheduled_date') as string
  const scheduledTime = (formData.get('scheduled_time') as string) || '09:00'
  const fbEnabled   = formData.get('platform_facebook') === '1'
  const igEnabled   = formData.get('platform_instagram') === '1'

  if (!mediaUrl || !scheduledDate) {
    throw new Error('URL da mídia e data são obrigatórios')
  }

  // Buscar dados do cliente
  const { data: client } = await supabase
    .from('clients')
    .select('facebook_page_id, facebook_page_token, instagram_account_id')
    .eq('id', clientId)
    .single()

  // Salvar no histórico do cliente
  const { data: content } = await supabase
    .from('contents')
    .insert({
      client_id:           clientId,
      title:               `Story ${scheduledDate}`,
      type:                'story',
      generated_image_url: mediaUrl,
      scheduled_date:      scheduledDate,
      status:              'published',
      caption:             null,
    })
    .select('id')
    .single()

  // Agendar nas redes sociais
  const pageToken = getMetaToken(client?.facebook_page_token)
  if (client?.facebook_page_id && pageToken) {
    const result = await scheduleStory({
      pageId:            client.facebook_page_id,
      pageToken,
      igAccountId:       client.instagram_account_id ?? null,
      mediaUrl,
      mediaType,
      scheduledDate,
      scheduledTime,
      platforms: { facebook: fbEnabled, instagram: igEnabled },
    })

    const update: Record<string, unknown> = {}
    if (result.facebook?.post_id) update.facebook_post_id = result.facebook.post_id
    if (result.instagram?.post_id) update.instagram_post_id = result.instagram.post_id
    if (content?.id && Object.keys(update).length > 0) {
      await supabase.from('contents').update(update).eq('id', content.id)
    }
  }

  redirect(`/clients/${clientId}/calendar`)
}
