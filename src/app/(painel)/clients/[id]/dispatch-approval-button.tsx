'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { dispararAprovacaoAction } from './actions'

function getWeekDates() {
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  return { weekStart: fmt(monday), weekEnd: fmt(sunday) }
}

export function DispatchApprovalButton({ clientId }: { clientId: string }) {
  const defaults = getWeekDates()
  const [weekStart, setWeekStart] = useState(defaults.weekStart)
  const [weekEnd, setWeekEnd] = useState(defaults.weekEnd)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleClick() {
    setStatus('loading')
    setError('')
    try {
      await dispararAprovacaoAction(clientId, weekStart, weekEnd)
      setStatus('ok')
      setTimeout(() => setStatus('idle'), 4000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao disparar')
      setStatus('error')
    }
  }

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-white">Disparar aprovação semanal</h3>
      <p className="text-xs text-zinc-500">Envia os conteúdos aprovados da semana para o grupo do WhatsApp do cliente.</p>

      <div className="flex gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-zinc-400">Início da semana</label>
          <input
            type="date"
            value={weekStart}
            onChange={e => setWeekStart(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-zinc-400">Fim da semana</label>
          <input
            type="date"
            value={weekEnd}
            onChange={e => setWeekEnd(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <button
          onClick={handleClick}
          disabled={status === 'loading'}
          className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
        >
          <Send className="h-4 w-4" />
          {status === 'loading' ? 'Enviando...' : 'Disparar'}
        </button>
      </div>

      {status === 'ok' && (
        <p className="text-sm text-green-400">Aprovacao disparada com sucesso!</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
