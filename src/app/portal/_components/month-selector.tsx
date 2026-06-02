'use client'

import { useRouter } from 'next/navigation'

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function labelMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return `${MONTHS_PT[m - 1]} ${y}`
}

function getAvailableMonths(): string[] {
  const months: string[] = []
  const start = new Date(2026, 0, 1) // Janeiro 2026
  const now = new Date()
  let d = new Date(start)
  while (d.getFullYear() < now.getFullYear() || d.getMonth() <= now.getMonth()) {
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    d.setMonth(d.getMonth() + 1)
    if (d > now) break
  }
  return months.reverse()
}

export function MonthSelector({ selected }: { selected: string }) {
  const router = useRouter()
  const months = getAvailableMonths()

  return (
    <select
      value={selected}
      onChange={e => router.push(`/portal/metricas?month=${e.target.value}`)}
      className="bg-[#131b2e] border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 cursor-pointer"
    >
      {months.map(m => (
        <option key={m} value={m}>{labelMonth(m)}</option>
      ))}
    </select>
  )
}
