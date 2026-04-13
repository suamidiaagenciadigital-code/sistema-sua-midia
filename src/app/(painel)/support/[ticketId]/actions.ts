'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function respondTicketAction(ticketId: string, formData: FormData) {
  const response = formData.get('response') as string
  if (!response?.trim()) return

  const supabase = await createClient()

  await supabase
    .from('support_tickets')
    .update({ final_response: response, status: 'responded' })
    .eq('id', ticketId)

  revalidatePath(`/support/${ticketId}`)
}

export async function closeTicketAction(ticketId: string) {
  const supabase = await createClient()

  await supabase
    .from('support_tickets')
    .update({ status: 'closed' })
    .eq('id', ticketId)

  revalidatePath(`/support/${ticketId}`)
  revalidatePath('/support')
}

export async function reopenTicketAction(ticketId: string) {
  const supabase = await createClient()

  await supabase
    .from('support_tickets')
    .update({ status: 'open' })
    .eq('id', ticketId)

  revalidatePath(`/support/${ticketId}`)
  revalidatePath('/support')
}

export async function deleteTicketAction(ticketId: string) {
  const supabase = await createClient()

  await supabase.from('support_tickets').delete().eq('id', ticketId)

  redirect('/support')
}
