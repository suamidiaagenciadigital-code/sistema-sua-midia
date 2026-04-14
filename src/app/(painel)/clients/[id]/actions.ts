'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const toArray = (val: string | null) =>
  val ? val.split(',').map(s => s.trim()).filter(Boolean) : []

export async function updateClientAction(id: string, formData: FormData) {
  const supabase = await createClient()

  const data = {
    name: formData.get('name') as string,
    niche: formData.get('niche') as string,
    slogan: formData.get('slogan') as string || null,
    target_audience: formData.get('target_audience') as string,
    pain_points: formData.get('pain_points') as string,
    differentials: formData.get('differentials') as string,
    tone_of_voice: formData.get('tone_of_voice') as string,
    brand_keywords: toArray(formData.get('brand_keywords') as string),
    forbidden_words: toArray(formData.get('forbidden_words') as string),
    visual_references: formData.get('visual_references') as string || null,
    monthly_goal: formData.get('monthly_goal') as string,
    contracted_services: formData.get('contracted_services') as string,
    ad_budget: formData.get('ad_budget') as string || null,
    success_metrics: formData.get('success_metrics') as string || null,
    revision_limit: formData.get('revision_limit') as string || null,
    extra_values: formData.get('extra_values') as string || null,
    catalog: formData.get('catalog') as string || null,
    ai_notes: formData.get('ai_notes') as string || null,
    brand_colors: toArray(formData.get('brand_colors') as string),
    brand_fonts: formData.get('brand_fonts') as string || null,
    visual_style: formData.get('visual_style') as string || null,
    visual_mandatory: formData.get('visual_mandatory') as string || null,
    visual_forbidden: formData.get('visual_forbidden') as string || null,
    status: formData.get('status') as string || 'ativo',
  }

  await supabase.from('clients').update(data).eq('id', id)
  revalidatePath(`/clients/${id}`)
}

export async function deleteClientAction(id: string) {
  const supabase = await createClient()
  await supabase.from('clients').delete().eq('id', id)
  redirect('/clients')
}

export async function dispararAprovacaoAction(clientId: string, weekStart: string, weekEnd: string) {
  const n8nUrl = process.env.N8N_WEBHOOK_URL || 'https://suamidia.app.n8n.cloud/webhook/disparar-aprovacao'

  const res = await fetch(n8nUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, weekStart, weekEnd }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`n8n retornou ${res.status}: ${body}`)
  }

  const data = await res.json()
  return { ok: true, approvalUrl: data.approvalUrl ?? null }
}
