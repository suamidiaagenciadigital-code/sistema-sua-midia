'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updateCampaignStatusAction(campaignId: string, status: string) {
  const supabase = await createClient()

  await supabase
    .from('ad_campaigns')
    .update({ status })
    .eq('id', campaignId)

  revalidatePath(`/ads/${campaignId}`)
  revalidatePath('/ads')
}

export async function deleteCampaignAction(campaignId: string) {
  const supabase = await createClient()

  await supabase.from('ad_campaigns').delete().eq('id', campaignId)

  redirect('/ads')
}
