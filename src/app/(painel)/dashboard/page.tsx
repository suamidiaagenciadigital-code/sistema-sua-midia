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
    { data: firstClient },
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
    supabase.from('clients')
      .select('id')
      .eq('status', 'ativo')
      .order('name')
      .limit(1)
      .single(),
  ])

  const metrics = [
    {
      label: 'Clientes ativos',
      value: totalClients ?? 0,
      icon: Users,
      gradient: 'from-blue-500/20 to-blue-600/10',
      iconColor: '#2B80FF',
      border: 'rgba(43,128,255,0.25)',
    },
    {
      label: 'Aguardando aprovação',
      value: pendingApprovals ?? 0,
      icon: Clock,
      gradient: 'from-amber-500/20 to-amber-600/10',
      iconColor: '#f59e0b',
      border: 'rgba(245,158,11,0.25)',
    },
    {
      label: 'Agendados esta semana',
      value: scheduledThisWeek ?? 0,
      icon: CalendarCheck,
      gradient: 'from-emerald-500/20 to-emerald-600/10',
      iconColor: '#34d399',
      border: 'rgba(52,211,153,0.25)',
    },
    {
      label: 'Atendimentos abertos',
      value: openTickets ?? 0,
      icon: MessageSquare,
      gradient: 'from-purple-500/20 to-purple-600/10',
      iconColor: '#A855F7',
      border: 'rgba(168,85,247,0.25)',
    },
  ]

  const typeLabel: Record<string, string> = {
    reel: 'Reel', carrossel: 'Carrossel', imagem: 'Imagem', story: 'Story'
  }

  const calendarHref = firstClient
    ? `/clients/${firstClient.id}/calendar`
    : '/clients'

  const quickActions = [
    { label: 'Novo cliente', href: '/clients/new' },
    { label: 'Ver clientes', href: '/clients' },
    { label: 'Ver calendário', href: calendarHref },
    { label: 'Atendimento', href: '/support' },
  ]

  return (
    <div className="space-y-8">
      {/* Título */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Visão geral da agência</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(({ label, value, icon: Icon, iconColor, border }) => (
          <div
            key={label}
            className="rounded-lg p-5 flex items-start justify-between"
            style={{ backgroundColor: '#131b2e', border: `1px solid ${border}` }}
          >
            <div>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="text-3xl font-extrabold text-white mt-1">{value}</p>
            </div>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${iconColor}20` }}
            >
              <Icon className="h-4.5 w-4.5" style={{ color: iconColor, width: 18, height: 18 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Atalhos rápidos */}
      <div
        className="rounded-lg p-5"
        style={{ backgroundColor: '#131b2e', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <h2 className="text-sm font-semibold text-white mb-4">Atalhos rápidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickActions.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="px-3 py-2.5 text-sm text-slate-500 hover:text-white transition-colors text-center rounded-lg lumina-quick-action"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Próximos para aprovar */}
      <div
        className="rounded-lg p-5"
        style={{ backgroundColor: '#131b2e', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Próximos conteúdos para aprovar</h2>
          <Link
            href="/approvals"
            className="text-xs font-medium transition-colors"
            style={{ color: '#2B80FF' }}
          >
            Ver todos →
          </Link>
        </div>

        {!nextContents?.length ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-600">
            <Clock className="h-7 w-7 mb-2" />
            <p className="text-sm">Nenhum conteúdo pendente</p>
          </div>
        ) : (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {nextContents.map((c: any) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div>
                  <p className="text-sm text-white font-medium">{c.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(c.clients as any)?.name} · {typeLabel[c.type] ?? c.type}
                    {c.scheduled_date ? ` · ${new Date(c.scheduled_date).toLocaleDateString('pt-BR')}` : ''}
                  </p>
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: 'rgba(245,158,11,0.12)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245,158,11,0.25)',
                  }}
                >
                  Pendente
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
