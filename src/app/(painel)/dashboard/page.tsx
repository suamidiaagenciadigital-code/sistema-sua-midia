import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Users, Clock, CalendarCheck, MessageSquare } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalClients },
    { count: pendingApprovals },
    { count: scheduledThisWeek },
    { count: openTickets },
    { data: nextContents },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('contents').select('*', { count: 'exact', head: true }).eq('status', 'pending_my_approval'),
    supabase.from('contents').select('*', { count: 'exact', head: true })
      .in('status', ['approved_by_me', 'approved_by_client'])
      .gte('scheduled_date', new Date().toISOString().split('T')[0])
      .lte('scheduled_date', new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('contents')
      .select('id, title, type, status, scheduled_date, clients(name)')
      .eq('status', 'pending_my_approval')
      .order('scheduled_date', { ascending: true })
      .limit(5),
  ])

  const metrics = [
    { label: 'Clientes ativos', value: totalClients ?? 0, icon: Users, color: 'text-blue-400' },
    { label: 'Aguardando aprovação', value: pendingApprovals ?? 0, icon: Clock, color: 'text-yellow-400' },
    { label: 'Agendados esta semana', value: scheduledThisWeek ?? 0, icon: CalendarCheck, color: 'text-green-400' },
    { label: 'Atendimentos abertos', value: openTickets ?? 0, icon: MessageSquare, color: 'text-red-400' },
  ]

  const typeLabel: Record<string, string> = {
    reel: 'Reel', carrossel: 'Carrossel', imagem: 'Imagem', story: 'Story'
  }

  const quickActions = [
    { label: 'Novo cliente', href: '/clients/new' },
    { label: 'Ver clientes', href: '/clients' },
    { label: 'Ver aprovações', href: '/approvals' },
    { label: 'Atendimento', href: '/support' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Visão geral da agência</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 flex items-start justify-between">
            <div>
              <p className="text-sm text-zinc-400">{label}</p>
              <p className="text-3xl font-bold text-white mt-1">{value}</p>
            </div>
            <Icon className={`h-5 w-5 ${color} mt-0.5`} />
          </div>
        ))}
      </div>

      {/* Próximos para aprovar */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Próximos conteúdos para aprovar</h2>
          <Link href="/approvals" className="text-xs text-zinc-400 hover:text-white transition-colors">Ver todos →</Link>
        </div>
        {!nextContents?.length ? (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-600">
            <Clock className="h-7 w-7 mb-2" />
            <p className="text-sm">Nenhum conteúdo pendente</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {nextContents.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm text-white font-medium">{c.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {(c.clients as any)?.name} · {typeLabel[c.type] ?? c.type}
                    {c.scheduled_date ? ` · ${new Date(c.scheduled_date).toLocaleDateString('pt-BR')}` : ''}
                  </p>
                </div>
                <span className="text-xs bg-yellow-900/40 text-yellow-400 border border-yellow-800 px-2 py-0.5 rounded">
                  Pendente
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Atalhos */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Atalhos rápidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickActions.map(({ label, href }) => (
            <Link key={label} href={href}
              className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors text-center">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
