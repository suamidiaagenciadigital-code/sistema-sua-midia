'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function updateIntegrationsAction(id: string, formData: FormData) {
  const supabase = await createClient()

  await supabase.from('clients').update({
    facebook_page_id:     formData.get('facebook_page_id') as string || null,
    facebook_page_token:  formData.get('facebook_page_token') as string || null,
    instagram_account_id: formData.get('instagram_account_id') as string || null,
    drive_folder_id:      formData.get('drive_folder_id') as string || null,
  }).eq('id', id)

  revalidatePath(`/clients/${id}/integrations`)
}

export async function disconnectTikTokAction(id: string) {
  await createServiceClient().from('tiktok_connections').delete().eq('client_id', id)
  revalidatePath(`/clients/${id}/integrations`)
}

export async function saveGbpAction(id: string, formData: FormData) {
  const supabase = await createClient()

  // O select manda "accountId|locationId|título" (ou vazio = sem perfil)
  const [accountId, locationId, ...rest] = String(formData.get('gbp_location') ?? '').split('|')
  const linked = !!accountId && !!locationId

  await supabase.from('clients').update({
    gbp_account_id: linked ? accountId : null,
    gbp_location_id: linked ? locationId : null,
    gbp_location_title: linked ? rest.join('|') : null,
    gbp_enabled: linked && formData.get('gbp_enabled') === 'on',
    gbp_cta_type: (formData.get('gbp_cta_type') as string) || 'LEARN_MORE',
    gbp_cta_url: (formData.get('gbp_cta_url') as string)?.trim() || null,
  }).eq('id', id)

  revalidatePath(`/clients/${id}/integrations`)
}
