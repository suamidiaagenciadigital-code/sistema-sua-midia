'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Check } from 'lucide-react'

interface ClientOption {
  id: string
  name: string
}

interface Props {
  currentId: string
  currentName: string
  clients: ClientOption[]
  month: number
  year: number
}

export function ClientSwitcher({ currentId, currentName, clients, month, year }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function goTo(clientId: string) {
    setOpen(false)
    router.push(`/clients/${clientId}/calendar?month=${month}&year=${year}`)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors group"
      >
        <span className="group-hover:text-slate-200 transition-colors">{currentName}</span>
        <span className="text-slate-600 group-hover:text-slate-400 transition-colors">· Calendário editorial</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 min-w-[220px] rounded-xl overflow-hidden shadow-xl"
          style={{ backgroundColor: '#0f1829', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Trocar cliente</p>
          </div>
          <div className="py-1 max-h-64 overflow-y-auto">
            {clients.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => goTo(c.id)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-white/5"
                style={{ color: c.id === currentId ? '#fff' : '#94a3b8' }}
              >
                <span className="truncate">{c.name}</span>
                {c.id === currentId && <Check className="h-3.5 w-3.5 shrink-0 text-sky-400" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
