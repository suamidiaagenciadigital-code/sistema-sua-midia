'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { AD_FIELDS, IG_FIELDS, isValidMonth } from '@/lib/portal-report'

export async function saveReportAction(clientId: string, month: string, formData: FormData) {
  if (!isValidMonth(month)) return

  const overrides: Record<string, number | string> = {}
  for (const f of [...IG_FIELDS, ...AD_FIELDS]) {
    const raw = String(formData.get(`ov_${f.key}`) ?? '').trim()
    if (raw === '') continue
    const n = Number(raw.replace(/\./g, '').replace(',', '.'))
    if (Number.isFinite(n)) overrides[f.key] = n
  }
  const label = String(formData.get('ov_ads_results_label') ?? '').trim()
  if (label) overrides.ads_results_label = label

  const supabase = await createClient()
  // upsert só com estas colunas: o snapshot automático do mês não é tocado
  await supabase.from('monthly_reports').upsert(
    {
      client_id: clientId,
      month,
      overrides,
      note: String(formData.get('note') ?? '').trim() || null,
      highlight: String(formData.get('highlight') ?? '').trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'client_id,month' },
  )

  revalidatePath(`/clients/${clientId}/relatorio`)
  revalidatePath('/portal/metricas')
}
