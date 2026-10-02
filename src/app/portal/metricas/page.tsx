import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { resolvePortalClient } from '@/lib/portal-session'
import { currentMonth, getMonthReport, getUpcoming, isValidMonth, monthLabel, shiftMonth } from '@/lib/portal-report'
import PortalNav from '@/app/portal/_components/portal-nav'
import PortalResumo from '@/app/portal/_components/portal-resumo'
import { MonthSelector } from '@/app/portal/_components/month-selector'

interface Props {
  searchParams: Promise<{ month?: string; cliente?: string }>
}

export default async function ResumoPage({ searchParams }: Props) {
  const sp = await searchParams
  const { clientId, isPreview } = await resolvePortalClient(sp.cliente)

  const db = createServiceClient()
  const { data: client } = await db
    .from('clients')
    .select('id, name, instagram_account_id, facebook_page_token, approval_token')
    .eq('id', clientId)
    .single()
  if (!client) redirect('/portal/login')

  const month = isValidMonth(sp.month) ? sp.month : currentMonth()
  const prevMonth = shiftMonth(month, -1)

  const [cur, prev, upcoming] = await Promise.all([
    getMonthReport(client, month),
    getMonthReport(client, prevMonth),
    getUpcoming(clientId),
  ])

  const previewClientId = isPreview ? clientId : undefined

  return (
    <div>
      <PortalNav clientName={client.name} active="metricas" previewClientId={previewClientId} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-white text-2xl font-bold">Resumo do mês</h1>
            <p className="text-slate-400 text-sm mt-1">
              {monthLabel(month)} · comparado a {monthLabel(prevMonth)}
            </p>
          </div>
          <MonthSelector selected={month} previewClientId={previewClientId} />
        </div>

        <PortalResumo
          cur={cur}
          prev={prev}
          curLabel={monthLabel(month)}
          prevLabel={monthLabel(prevMonth)}
          upcoming={upcoming.next}
          pendingApprovals={upcoming.pending}
          approvalToken={client.approval_token}
          hasInstagram={!!client.instagram_account_id}
        />
      </main>
    </div>
  )
}
