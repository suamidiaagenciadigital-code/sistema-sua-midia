'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createProposalAction(formData: FormData) {
  const supabase = createServiceClient()

  const slug            = (formData.get('slug') as string).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  const client_name     = formData.get('client_name') as string
  const service_title   = formData.get('service_title') as string
  const service_description = formData.get('service_description') as string
  const monthly_value   = parseFloat((formData.get('monthly_value') as string).replace(',', '.'))
  const whatsapp        = formData.get('whatsapp') as string
  const email           = formData.get('email') as string
  const valid_days      = parseInt(formData.get('valid_days') as string) || 15
  const deliverablesRaw = formData.get('deliverables_json') as string
  const avulsosRaw      = formData.get('avulsos_json') as string

  const deliverables = JSON.parse(deliverablesRaw || '[]')
  const avulsos      = JSON.parse(avulsosRaw || '[]')

  const { data, error } = await supabase
    .from('proposals')
    .insert({
      slug,
      client_name,
      service_title,
      service_description,
      monthly_value,
      deliverables,
      avulsos,
      whatsapp,
      email,
      valid_days,
      status: 'active',
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  redirect(`/propostas/preview/${data.id}`)
}

export async function updateProposalStatusAction(id: string, status: 'active' | 'expired' | 'closed') {
  const supabase = createServiceClient()
  await supabase.from('proposals').update({ status }).eq('id', id)
}

export async function deleteProposalAction(id: string) {
  const supabase = createServiceClient()
  await supabase.from('proposals').delete().eq('id', id)
  redirect('/propostas')
}
