'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'

interface Props {
  clients: { id: string; name: string }[]
}

interface GeneratedCampaign {
  strategy: string
  copies: { label: string; headline: string; body: string; cta: string }[]
  audience_suggestion: string
}

const base = "w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"

export function AdsGenerator({ clients }: Props) {
  const router = useRouter()
  const [generating, startGenerate] = useTransition()
  const [saving, startSave] = useTransition()
  const [error, setError] = useState('')

  const [clientId, setClientId] = useState('')
  const [objective, setObjective] = useState('')
  const [budget, setBudget] = useState('')
  const [period, setPeriod] = useState('')
  const [result, setResult] = useState<GeneratedCampaign | null>(null)

  function generate() {
    if (!clientId || !objective) {
      setError('Selecione o cliente e informe o objetivo.')
      return
    }
    setError('')
    startGenerate(async () => {
      try {
        const res = await fetch('/api/ads/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, objective, budget, period }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Erro ao gerar')
        setResult(data)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  function save() {
    if (!result) return
    startSave(async () => {
      try {
        const res = await fetch('/api/ads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, objective, budget, period, ...result }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar')
        router.push(`/ads/${data.id}`)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* Formulário */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-zinc-300 font-medium">Cliente <span className="text-red-400">*</span></label>
          <select value={clientId} onChange={e => setClientId(e.target.value)} className={base}>
            <option value="">Selecione...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-300 font-medium">Objetivo da campanha <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={objective}
            onChange={e => setObjective(e.target.value)}
            placeholder="Ex: Gerar leads para serviço de barbearia premium"
            className={base}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-zinc-300 font-medium">Verba (R$)</label>
            <input
              type="text"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              placeholder="Ex: R$ 500/mês"
              className={base}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-zinc-300 font-medium">Período</label>
            <input
              type="text"
              value={period}
              onChange={e => setPeriod(e.target.value)}
              placeholder="Ex: Abril 2026"
              className={base}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="button"
          onClick={generate}
          disabled={generating}
          className="flex items-center gap-2 rounded-md bg-white px-5 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors disabled:opacity-50"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? 'Gerando estratégia...' : 'Gerar com IA'}
        </button>
      </div>

      {/* Resultado */}
      {result && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">Estratégia</h2>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{result.strategy}</p>
          </div>

          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white">Copies (A/B)</h2>
            {result.copies.map((copy, i) => (
              <div key={i} className="border border-zinc-800 rounded-md p-4 space-y-2">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{copy.label}</p>
                <p className="text-sm font-medium text-white">{copy.headline}</p>
                <p className="text-sm text-zinc-300">{copy.body}</p>
                <p className="text-xs text-zinc-500">CTA: {copy.cta}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-5 space-y-2">
            <h2 className="text-sm font-semibold text-white">Sugestão de público</h2>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{result.audience_suggestion}</p>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-white py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? 'Salvando...' : 'Salvar campanha'}
          </button>
        </div>
      )}
    </div>
  )
}
