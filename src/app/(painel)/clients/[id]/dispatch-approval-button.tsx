'use client'

import { useState } from 'react'
import { Send, ExternalLink, Copy, Check } from 'lucide-react'
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

export function DispatchApprovalButton({ clientId, approvalToken }: { clientId: string; approvalToken: string | null }) {
  const previewUrl = approvalToken ? `https://sistema-sua-midia.vercel.app/approve/${approvalToken}` : null
  const defaults = getWeekDates()
  const [weekStart, setWeekStart] = useState(defaults.weekStart)
  const [weekEnd, setWeekEnd] = useState(defaults.weekEnd)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [approvalUrl, setApprovalUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setStatus('loading')
    setError('')
    try {
      const result = await dispararAprovacaoAction(clientId, weekStart, weekEnd)
      setApprovalUrl(result.approvalUrl ?? '')
      setStatus('ok')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao disparar')
      setStatus('error')
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(approvalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Disparar aprovação semanal</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Envia 1 link no grupo do WhatsApp. O cliente visualiza os criativos e aprova diretamente no sistema.
          </p>
        </div>
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 flex-shrink-0 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-md px-3 py-1.5 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Pré-visualizar
          </a>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-end">
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
        <div className="rounded-md bg-green-950/40 border border-green-800/50 p-3 space-y-2">
          <p className="text-sm text-green-400 font-medium">Link enviado no WhatsApp!</p>
          {approvalUrl && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 truncate flex-1">{approvalUrl}</span>
              <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors flex-shrink-0">
                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <a href={approvalUrl} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors flex-shrink-0">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
