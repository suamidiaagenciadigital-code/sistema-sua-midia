'use client'

import { useState, useMemo } from 'react'

const TYPE_EMOJI: Record<string, string> = {
  imagem: '📷', reel: '🎬', carrossel: '🗂️', story: '📲',
}
const TYPE_LABEL: Record<string, string> = {
  imagem: 'Imagem', reel: 'Reel', carrossel: 'Carrossel', story: 'Story',
}
const STATUS_COLOR: Record<string, string> = {
  draft: 'text-slate-500',
  pending_my_approval: 'text-yellow-500',
  sent_to_client: 'text-blue-400',
  approved_by_client: 'text-green-400',
  published: 'text-green-400',
  revision: 'text-orange-400',
}
const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  pending_my_approval: 'Em produção',
  sent_to_client: 'Aguardando aprovação',
  approved_by_client: 'Aprovado',
  published: 'Publicado',
  revision: 'Em revisão',
}

type Content = {
  id: string
  title: string | null
  type: string
  status: string
  scheduled_date: string | null
  scheduled_time: string | null
}

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                 'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

export default function PortalCalendario({ contents }: { contents: Content[] }) {
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  // Agrupar por data
  const byDate = useMemo(() => {
    const map: Record<string, Content[]> = {}
    for (const c of contents) {
      if (!c.scheduled_date) continue
      const [y, m] = c.scheduled_date.split('-').map(Number)
      if (y === year && m - 1 === month) {
        if (!map[c.scheduled_date]) map[c.scheduled_date] = []
        map[c.scheduled_date].push(c)
      }
    }
    return map
  }, [contents, year, month])

  // Dias do mês
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const todayStr = today.toISOString().split('T')[0]

  // Total do mês
  const monthTotal = Object.values(byDate).flat().length

  return (
    <div className="space-y-6">
      {/* Cabeçalho do calendário */}
      <div className="bg-[#131b2e] rounded-2xl p-4 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">‹</button>
          <div className="text-center">
            <p className="text-white font-semibold">{MONTHS[month]} {year}</p>
            <p className="text-slate-500 text-xs">{monthTotal} publicaç{monthTotal !== 1 ? 'ões' : 'ão'} no mês</p>
          </div>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">›</button>
        </div>

        {/* Dias da semana */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-slate-500 text-xs py-1 font-medium">{d}</div>
          ))}
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7 gap-1">
          {/* Espaços vazios antes do dia 1 */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Dias do mês */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayContents = byDate[dateStr] ?? []
            const isToday = dateStr === todayStr
            const hasPosts = dayContents.length > 0

            return (
              <div
                key={day}
                className={`min-h-[52px] rounded-xl p-1.5 border transition-colors ${
                  isToday
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : hasPosts
                      ? 'border-slate-700 bg-slate-800/40'
                      : 'border-transparent'
                }`}
              >
                <p className={`text-xs font-medium text-center mb-1 ${
                  isToday ? 'text-blue-400' : hasPosts ? 'text-white' : 'text-slate-600'
                }`}>
                  {day}
                </p>
                <div className="flex flex-wrap gap-0.5 justify-center">
                  {dayContents.slice(0, 4).map(c => (
                    <span
                      key={c.id}
                      title={`${TYPE_LABEL[c.type] ?? c.type} — ${STATUS_LABEL[c.status] ?? c.status}${c.scheduled_time ? ' · ' + c.scheduled_time : ''}`}
                      className="text-[10px] leading-none"
                    >
                      {TYPE_EMOJI[c.type] ?? '📄'}
                    </span>
                  ))}
                  {dayContents.length > 4 && (
                    <span className="text-[9px] text-slate-500">+{dayContents.length - 4}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista do mês */}
      {monthTotal > 0 ? (
        <div className="space-y-2">
          <p className="text-slate-400 text-sm font-medium">Detalhes do mês</p>
          {Object.entries(byDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, items]) => (
              <div key={date} className="bg-[#131b2e] rounded-xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-800 bg-slate-800/30">
                  <p className="text-white text-sm font-medium">
                    {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long', day: 'numeric', month: 'long'
                    })}
                  </p>
                </div>
                <div className="divide-y divide-slate-800">
                  {items.map(c => (
                    <div key={c.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{TYPE_EMOJI[c.type] ?? '📄'}</span>
                        <div>
                          <p className="text-white text-sm">{c.title || TYPE_LABEL[c.type] || c.type}</p>
                          <p className="text-slate-500 text-xs">{c.scheduled_time ?? '—'}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium ${STATUS_COLOR[c.status] ?? 'text-slate-400'}`}>
                        {STATUS_LABEL[c.status] ?? c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm">Nenhuma publicação agendada para este mês.</p>
        </div>
      )}
    </div>
  )
}
