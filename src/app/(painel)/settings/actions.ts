'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

export async function disconnectGoogleAction() {
  await createServiceClient()
    .from('google_connections')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  revalidatePath('/settings')
}
