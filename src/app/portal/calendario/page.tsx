import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { resolvePortalClient } from '@/lib/portal-session'
import PortalNav from '@/app/portal/_components/portal-nav'
import PortalCalendario from '@/app/portal/_components/portal-calendario'

export default async function CalendarioPage({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const sp = await searchParams
  const { clientId, isPreview } = await resolvePortalClient(sp.cliente)

  const db = createServiceClient()

  const { data: client } = await db
    .from('clients')
    .select('id, name')
    .eq('id', clientId)
    .single()

  if (!client) redirect('/portal/login')

  // Todos os conteúdos com data agendada (qualquer status exceto rascunho)
  const { data: contents } = await db
    .from('contents')
    .select('id, title, type, status, scheduled_date, scheduled_time')
    .eq('client_id', clientId)
    .not('scheduled_date', 'is', null)
    .not('status', 'eq', 'draft')
    .order('scheduled_date', { ascending: true })

  return (
    <div>
      <PortalNav clientName={client.name} active="calendario" previewClientId={isPreview ? clientId : undefined} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold">Calendário Editorial</h1>
          <p className="text-slate-400 text-sm mt-1">Planejamento de publicações do mês</p>
        </div>
        <PortalCalendario contents={contents ?? []} />
      </main>
    </div>
  )
}
