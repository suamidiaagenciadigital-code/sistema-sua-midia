'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
