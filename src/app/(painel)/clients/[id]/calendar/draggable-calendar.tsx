'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { STATUS_DOT, TYPE_ICON, ContentStatus } from '@/lib/content-status'

interface ContentItem {
  id: string
  title: string
  type: string
  status: string
  scheduled_date: string | null
  caption?: string | null
}

interface Props {
  clientId: string
  year: number
  month: number
  contents: ContentItem[]
  firstWeekday: number
  daysInMonth: number
}

export function DraggableCalendar({ clientId, year, month, contents, firstWeekday, daysInMonth }: Props) {
  const router = useRouter()
  const [items, setItems] = useState<ContentItem[]>(contents)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  // Sincroniza items quando o prop contents muda (navegação entre meses)
  useEffect(() => {
    setItems(contents)
  }, [contents])

  const [dragOverDay, setDragOverDay] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const today = new Date()

  // Montar mapa dia → conteúdos
  const byDay: Record<number, ContentItem[]> = {}
  for (const c of items) {
    if (!c.scheduled_date) continue
    const parts = c.scheduled_date.split('-').map(Number)
    const [cy, cm, cd] = parts as [number, number, number]
    if (cy !== year || cm !== month) continue
    if (!byDay[cd]) byDay[cd] = []
    byDay[cd]!.push(c)
  }

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, day: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverDay(day)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverDay(null)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, day: number) => {
    e.preventDefault()
    setDragOverDay(null)

    const id = e.dataTransfer.getData('text/plain')
    if (!id) return

    const newDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    // Optimistic update
    setItems(prev =>
      prev.map(c => c.id === id ? { ...c, scheduled_date: newDate } : c)
    )
    setDraggingId(null)
    setSaving(true)

    try {
      const res = await fetch(`/api/contents/${id}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_date: newDate }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
    } catch {
      // Reverter em caso de erro
      setItems(contents)
      alert('Erro ao reagendar. Tente novamente.')
    } finally {
      setSaving(false)
      router.refresh()
    }
  }, [year, month, contents, router])

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
    setDragOverDay(null)
  }, [])

  return (
    <div
      className="rounded-xl overflow-hidden overflow-x-auto"
      style={{ backgroundColor: '#131b2e', border: '1px solid rgba(255,255,255,0.08)' }}
    >
    <div className="min-w-[560px]">
      {saving && (
        <div
          className="px-4 py-1.5 text-xs text-blue-300 text-center"
          style={{ backgroundColor: 'rgba(43,128,255,0.12)', borderBottom: '1px solid rgba(43,128,255,0.2)' }}
        >
          Salvando nova data…
        </div>
      )}

      {/* Cabeçalho dos dias da semana */}
      <div
        className="grid grid-cols-7"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}
      >
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div
            key={d}
            className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-widest"
            style={{ color: '#475569' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Dias */}
      <div className="grid grid-cols-7">
        {/* Células vazias antes do primeiro dia */}
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="min-h-24 p-1"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              borderRight: '1px solid rgba(255,255,255,0.05)',
              backgroundColor: 'rgba(0,0,0,0.15)',
            }}
          />
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
          const isDragOver = dragOverDay === day

          return (
            <div
              key={day}
              onDragOver={(e) => handleDragOver(e, day)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day)}
              className="min-h-24 p-1.5 transition-colors"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                borderRight: isLastCol ? 'none' : '1px solid rgba(255,255,255,0.05)',
                backgroundColor: isDragOver
                  ? 'rgba(43,128,255,0.12)'
                  : isToday
                  ? 'rgba(43,128,255,0.07)'
                  : undefined,
                outline: isDragOver ? '1px solid rgba(43,128,255,0.4)' : undefined,
                outlineOffset: '-1px',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                {isToday ? (
                  <span
                    className="text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full text-white"
                    style={{ background: 'linear-gradient(135deg, #2B80FF, #A855F7)' }}
                  >
                    {day}
                  </span>
                ) : (
                  <span className="text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full" style={{ color: '#475569' }}>
                    {day}
                  </span>
                )}
                <Link
                  href={`/clients/${clientId}/content/new`}
                  className="transition-colors"
                  style={{ color: 'rgba(255,255,255,0.15)' }}
                >
                  <Plus className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-0.5">
                {dayContents.map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, c.id)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-1 rounded px-1 py-0.5 transition-all cursor-grab active:cursor-grabbing
                      ${draggingId === c.id ? 'opacity-40 scale-95' : ''}
                    `}
                    style={draggingId !== c.id ? { backgroundColor: 'rgba(255,255,255,0.04)' } : undefined}
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[c.status as ContentStatus] ?? 'bg-zinc-500'}`}
                    />
                    <Link
                      href={`/clients/${clientId}/content/${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs truncate leading-tight flex-1 min-w-0"
                      style={{ color: '#94a3b8' }}
                      title={c.title}
                    >
                      {TYPE_ICON[c.type]} {c.title}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Células vazias depois do último dia */}
        {Array.from({ length: (7 - ((firstWeekday + daysInMonth) % 7)) % 7 }).map((_, i) => (
          <div
            key={`end-${i}`}
            className="min-h-24 p-1"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              borderRight: i === (7 - ((firstWeekday + daysInMonth) % 7)) % 7 - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
              backgroundColor: 'rgba(0,0,0,0.15)',
            }}
          />
        ))}
      </div>
    </div>
    </div>
  )
}
