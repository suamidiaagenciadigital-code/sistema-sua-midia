import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, ChevronRight, Plus, Sparkles } from 'lucide-react'
import { STATUS_DOT, STATUS_LABEL, TYPE_ICON, TYPE_LABEL, ContentStatus } from '@/lib/content-status'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ month?: string; year?: string }>
}

export default async function CalendarPage({ params, searchParams }: Props) {
  const { id } = await params
  const sp = await searchParams

  const now = new Date()
  const year = parseInt(sp.year ?? String(now.getFullYear()))
  const month = parseInt(sp.month ?? String(now.getMonth() + 1))

  const supabase = await createClient()
  const { data: client } = await supabase.from('clients').select('id, name').eq('id', id).single()
  if (!client) notFound()

  // Buscar conteúdos do mês
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0)
  const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`

  const { data: contents } = await supabase
    .from('contents')
    .select('id, title, type, status, scheduled_date, caption')
    .eq('client_id', id)
    .gte('scheduled_date', firstDay)
    .lte('scheduled_date', lastDayStr)
    .order('scheduled_date')

  // Montar mapa dia → conteúdos
  const byDay: Record<number, typeof contents> = {}
  for (const c of contents ?? []) {
    const day = new Date(c.scheduled_date + 'T12:00:00').getDate()
    if (!byDay[day]) byDay[day] = []
    byDay[day]!.push(c)
  }

  // Navegação de mês
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  // Gerar dias do calendário
  const firstWeekday = new Date(year, month - 1, 1).getDay() // 0=dom
  const daysInMonth = new Date(year, month, 0).getDate()
  const today = new Date()

  const monthName = new Date(year, month - 1, 1).toLocaleString('pt-BR', { month: 'long' })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/clients/${id}`} className="text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white capitalize">{monthName} {year}</h1>
            <p className="text-zinc-400 text-sm mt-0.5">{client.name} · Calendário editorial</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/clients/${id}/calendar?month=${prevMonth}&year=${prevYear}`}
            className="rounded-md border border-zinc-700 p-1.5 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={`/clients/${id}/calendar?month=${nextMonth}&year=${nextYear}`}
            className="rounded-md border border-zinc-700 p-1.5 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/clients/${id}/content/new`}
            className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors ml-2"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Gerar conteúdo
          </Link>
        </div>
      </div>

      {/* Legenda de status */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(STATUS_LABEL) as [ContentStatus, string][]).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-zinc-400">
            <div className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
            {label}
          </div>
        ))}
      </div>

      {/* Grade do calendário */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 border-b border-zinc-800">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="px-2 py-2 text-center text-xs font-medium text-zinc-500 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Dias */}
        <div className="grid grid-cols-7">
          {/* Células vazias antes do primeiro dia */}
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-24 border-b border-r border-zinc-800 bg-zinc-950/30 p-1" />
          ))}

          {/* Dias do mês */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayContents = byDay[day] ?? []
            const isToday =
              today.getDate() === day &&
              today.getMonth() + 1 === month &&
              today.getFullYear() === year
            const col = (firstWeekday + i) % 7
            const isLastCol = col === 6

            return (
              <div
                key={day}
                className={`min-h-24 border-b border-r border-zinc-800 p-1.5 ${isLastCol ? 'border-r-0' : ''} ${isToday ? 'bg-zinc-800/50' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-white text-zinc-900' : 'text-zinc-400'
                  }`}>
                    {day}
                  </span>
                  <Link
                    href={`/clients/${id}/content/new`}
                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </Link>
                </div>

                <div className="space-y-0.5">
                  {dayContents.map((c: any) => (
                    <Link
                      key={c.id}
                      href={`/clients/${id}/content/${c.id}`}
                      className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-zinc-700/50 transition-colors group/card"
                    >
                      <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[c.status as ContentStatus] ?? 'bg-zinc-500'}`} />
                      <span className="text-xs text-zinc-300 truncate leading-tight">
                        {TYPE_ICON[c.type]} {c.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Células vazias depois do último dia */}
          {Array.from({ length: (7 - ((firstWeekday + daysInMonth) % 7)) % 7 }).map((_, i) => (
            <div key={`end-${i}`} className="min-h-24 border-b border-r border-zinc-800 bg-zinc-950/30 p-1 last:border-r-0" />
          ))}
        </div>
      </div>

      {/* Lista do mês (view alternativa) */}
      {(contents?.length ?? 0) > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-white">{contents?.length} conteúdo{contents?.length !== 1 ? 's' : ''} neste mês</h2>
          </div>
          <div className="divide-y divide-zinc-800">
            {contents?.map((c: any) => (
              <Link
                key={c.id}
                href={`/clients/${id}/content/${c.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{TYPE_ICON[c.type]}</span>
                  <div>
                    <p className="text-sm text-white font-medium">{c.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {TYPE_LABEL[c.type]} · {new Date(c.scheduled_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs ${STATUS_COLOR_CLASSES[c.status as ContentStatus] ?? ''}`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[c.status as ContentStatus]}`} />
                  {STATUS_LABEL[c.status as ContentStatus]}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const STATUS_COLOR_CLASSES: Record<ContentStatus, string> = {
  draft: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  pending_my_approval: 'bg-yellow-900/30 text-yellow-300 border-yellow-800',
  approved_by_me: 'bg-blue-900/30 text-blue-300 border-blue-800',
  sent_to_client: 'bg-orange-900/30 text-orange-300 border-orange-800',
  approved_by_client: 'bg-green-900/30 text-green-300 border-green-800',
  published: 'bg-emerald-900/30 text-emerald-300 border-emerald-800',
  revision: 'bg-red-900/30 text-red-300 border-red-800',
}
