import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, ChevronRight, Plus, CalendarDays, ExternalLink } from 'lucide-react'
import { STATUS_DOT, STATUS_LABEL, TYPE_ICON, TYPE_LABEL, ContentStatus } from '@/lib/content-status'
import { ImportCalendarButton } from './import-calendar-button'
import { DraggableCalendar } from './draggable-calendar'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ month?: string; year?: string }>
}

// Status badge inline styles (Lumina solid colors)
const STATUS_BADGE_STYLE: Record<ContentStatus, React.CSSProperties> = {
  draft:               { backgroundColor: '#1e293b', color: '#64748b' },
  pending_my_approval: { backgroundColor: 'rgba(161,98,7,0.3)',  color: '#fbbf24' },
  approved_by_me:      { backgroundColor: 'rgba(29,78,216,0.3)', color: '#60a5fa' },
  sent_to_client:      { backgroundColor: 'rgba(154,52,18,0.3)', color: '#fb923c' },
  approved_by_client:  { backgroundColor: 'rgba(20,83,45,0.3)',  color: '#4ade80' },
  published:           { backgroundColor: 'rgba(6,78,59,0.4)',   color: '#34d399' },
  revision:            { backgroundColor: 'rgba(127,29,29,0.3)', color: '#f87171' },
}

// Stats card definitions
const STATS_CARDS = [
  { status: 'published'          as ContentStatus, label: 'Publicados',          dotClass: 'bg-emerald-400' },
  { status: 'approved_by_client' as ContentStatus, label: 'Aprovados cliente',   dotClass: 'bg-green-400'   },
  { status: 'sent_to_client'     as ContentStatus, label: 'Enviados',            dotClass: 'bg-orange-400'  },
  { status: 'approved_by_me'     as ContentStatus, label: 'Aprovados por mim',   dotClass: 'bg-blue-400'    },
  { status: 'pending_my_approval'as ContentStatus, label: 'Aguardando',          dotClass: 'bg-yellow-400'  },
  { status: 'revision'           as ContentStatus, label: 'Revisão',             dotClass: 'bg-red-400'     },
  { status: 'draft'              as ContentStatus, label: 'Rascunhos',           dotClass: 'bg-zinc-500'    },
]

export default async function CalendarPage({ params, searchParams }: Props) {
  const { id } = await params
  const sp = await searchParams

  const now = new Date()
  const year  = parseInt(sp.year  ?? String(now.getFullYear()))
  const month = parseInt(sp.month ?? String(now.getMonth() + 1))

  const supabase = await createClient()
  const { data: client } = await supabase.from('clients').select('id, name').eq('id', id).single()
  if (!client) notFound()

  // Token de aprovação para o link de pré-visualização do cliente
  const { data: clientExtra } = await supabase
    .from('clients')
    .select('approval_token')
    .eq('id', id)
    .single()
  const approvalToken = clientExtra?.approval_token ?? null

  // Buscar conteúdos do mês
  const firstDay  = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay   = new Date(year, month, 0)
  const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`

  const { data: contents } = await supabase
    .from('contents')
    .select('id, title, type, status, scheduled_date, caption')
    .eq('client_id', id)
    .gte('scheduled_date', firstDay)
    .lte('scheduled_date', lastDayStr)
    .order('scheduled_date')

  // Rascunhos sem data
  const { data: undated } = await supabase
    .from('contents')
    .select('id, title, type, status, scheduled_date')
    .eq('client_id', id)
    .is('scheduled_date', null)
    .order('created_at', { ascending: false })

  // Navegação de mês
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear  = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear  = month === 12 ? year + 1 : year

  // Gerar dias do calendário
  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const daysInMonth  = new Date(year, month, 0).getDate()

  const monthName = new Date(year, month - 1, 1).toLocaleString('pt-BR', { month: 'long' })

  // Contagem por status
  const statusCounts: Record<string, number> = {}
  for (const c of contents ?? []) {
    statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Título */}
        <div className="flex items-center gap-3">
          <Link
            href={`/clients/${id}`}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <ChevronLeft className="h-4 w-4 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white capitalize">{monthName} {year}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{client.name} · Calendário editorial</p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center flex-wrap gap-2 pl-11 sm:pl-0">
          {/* Setas de navegação */}
          <Link
            href={`/clients/${id}/calendar?month=${prevMonth}&year=${prevYear}`}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:text-white text-slate-400"
            style={{ border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)' }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={`/clients/${id}/calendar?month=${nextMonth}&year=${nextYear}`}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:text-white text-slate-400"
            style={{ border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)' }}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>

          {/* Link de aprovação do cliente */}
          {approvalToken && (
            <a
              href={`/approve/${approvalToken}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)' }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Aprovação
            </a>
          )}

          {/* Importar calendário */}
          <ImportCalendarButton clientId={id} />

          {/* Novo conteúdo */}
          <Link
            href={`/clients/${id}/content/new`}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(to right, #2B80FF, #A855F7)' }}
          >
            <Plus className="h-4 w-4" />
            Novo
          </Link>
        </div>
      </div>

      {/* Legenda de status */}
      <div
        className="flex flex-wrap gap-x-5 gap-y-2 px-4 py-3 rounded-xl"
        style={{ backgroundColor: '#131b2e', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {(Object.entries(STATUS_LABEL) as [ContentStatus, string][]).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
            {label}
          </div>
        ))}
      </div>

      {/* Grade do calendário (drag & drop) */}
      <DraggableCalendar
        clientId={id}
        year={year}
        month={month}
        contents={contents ?? []}
        firstWeekday={firstWeekday}
        daysInMonth={daysInMonth}
      />

      {/* Stats cards */}
      {(contents?.length ?? 0) > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
          {STATS_CARDS.map(({ status, label, dotClass }) => {
            const count = statusCounts[status] ?? 0
            return (
              <div
                key={status}
                className="rounded-xl p-3 flex flex-col items-center gap-1.5"
                style={{ backgroundColor: '#131b2e', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
                <span className="text-xl font-extrabold text-white">{count}</span>
                <span className="text-xs text-slate-500 text-center leading-tight">{label}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Rascunhos sem data */}
      {(undated?.length ?? 0) > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: '#131b2e', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <CalendarDays className="h-4 w-4" style={{ color: '#d97706' }} />
              Conteúdos sem data
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(217,119,6,0.2)', color: '#fbbf24' }}
              >
                {undated!.length}
              </span>
            </h2>
            <p className="text-xs text-slate-600">Defina uma data para aparecerem no calendário</p>
          </div>
          <div>
            {undated!.map((c: any, idx: number) => (
              <Link
                key={c.id}
                href={`/clients/${id}/content/${c.id}`}
                className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-white/[0.02]"
                style={idx < undated!.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.05)' } : {}}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{TYPE_ICON[c.type]}</span>
                  <div>
                    <p className="text-sm text-white font-medium">{c.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{TYPE_LABEL[c.type]} · sem data definida</p>
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={STATUS_BADGE_STYLE[c.status as ContentStatus]}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[c.status as ContentStatus]}`} />
                  {STATUS_LABEL[c.status as ContentStatus]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Lista do mês */}
      {(contents?.length ?? 0) > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: '#131b2e', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Accent bar top */}
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(to right, #2B80FF, #A855F7)' }} />

          <div
            className="px-5 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h2 className="text-sm font-semibold text-white">
              {contents?.length} conteúdo{contents?.length !== 1 ? 's' : ''} neste mês
            </h2>
          </div>

          <div>
            {contents?.map((c: any, idx: number) => (
              <Link
                key={c.id}
                href={`/clients/${id}/content/${c.id}`}
                className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-white/[0.02]"
                style={idx < (contents?.length ?? 0) - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.05)' } : {}}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{TYPE_ICON[c.type]}</span>
                  <div>
                    <p className="text-sm text-white font-medium">{c.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {TYPE_LABEL[c.type]} · {c.scheduled_date?.split('-').reverse().join('/')}
                    </p>
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={STATUS_BADGE_STYLE[c.status as ContentStatus]}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[c.status as ContentStatus]}`} />
                  {STATUS_LABEL[c.status as ContentStatus]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
