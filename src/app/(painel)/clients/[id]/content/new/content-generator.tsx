'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Sparkles, Save, RefreshCw } from 'lucide-react'

interface Generated {
  title: string
  caption: string
  script: string | null
  image_prompt: string
  cta: string
  partner_mentioned: string | null
}

const contentTypes = [
  { value: 'reel', label: 'Reel', desc: 'Vídeo vertical ~30-60s' },
  { value: 'carrossel', label: 'Carrossel', desc: '5-8 slides educativos' },
  { value: 'imagem', label: 'Imagem', desc: 'Post de feed' },
  { value: 'story', label: 'Story', desc: 'Conteúdo efêmero' },
]

export default function ContentGenerator({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [type, setType] = useState('reel')
  const [theme, setTheme] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generated, setGenerated] = useState<Generated | null>(null)
  const [edited, setEdited] = useState<Generated | null>(null)
  const [scheduledDate, setScheduledDate] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, type, theme }),
      })
      if (!res.ok) throw new Error('Erro ao gerar conteúdo')
      const data = await res.json()
      setGenerated(data)
      setEdited(data)
    } catch {
      setError('Erro ao conectar com a IA. Verifique sua chave da API.')
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    if (!edited) return
    setSaving(true)
    try {
      const res = await fetch('/api/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          type,
          scheduled_date: scheduledDate || null,
          status: 'draft',
          ...edited,
        }),
      })
      if (res.ok) setSaved(true)
    } catch {
      setError('Erro ao salvar conteúdo.')
    } finally {
      setSaving(false)
    }
  }

  const field = (label: string, key: keyof Generated, rows = 3) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">{label}</label>
      <textarea
        rows={rows}
        value={(edited?.[key] as string) ?? ''}
        onChange={e => setEdited(prev => prev ? { ...prev, [key]: e.target.value } : prev)}
        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 resize-none"
      />
    </div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/clients/${clientId}`} className="text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Gerar conteúdo</h1>
          <p className="text-zinc-400 text-sm mt-0.5">{clientName}</p>
        </div>
      </div>

      {/* Configuração */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Configurar geração</h2>

        {/* Tipo */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Tipo de conteúdo</label>
          <div className="grid grid-cols-4 gap-2">
            {contentTypes.map(ct => (
              <button
                key={ct.value}
                type="button"
                onClick={() => setType(ct.value)}
                className={`rounded-md border p-3 text-left transition-colors ${
                  type === ct.value
                    ? 'border-white bg-zinc-700 text-white'
                    : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white'
                }`}
              >
                <div className="text-sm font-medium">{ct.label}</div>
                <div className="text-xs mt-0.5 opacity-70">{ct.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Tema opcional */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
            Tema / gancho <span className="normal-case text-zinc-600">(opcional — a IA escolhe se deixar vazio)</span>
          </label>
          <input
            type="text"
            value={theme}
            onChange={e => setTheme(e.target.value)}
            placeholder="Ex: Dia do noivo, barba perfeita, experiência com cerveja..."
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
          />
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 rounded-md bg-white px-5 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><RefreshCw className="h-4 w-4 animate-spin" /> Gerando...</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Gerar com IA</>
          )}
        </button>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>

      {/* Resultado editável */}
      {edited && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Conteúdo gerado — edite antes de salvar</h2>
            <button
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerar
            </button>
          </div>

          {field('Título / Tema', 'title', 1)}
          {field('Copy / Legenda', 'caption', 6)}
          {type === 'reel' || type === 'carrossel' ? field('Roteiro / Estrutura de slides', 'script', 8) : null}
          {field('Prompt de imagem (para geração visual)', 'image_prompt', 3)}
          {field('CTA', 'cta', 1)}
          {field('Parceiro mencionado', 'partner_mentioned', 1)}

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Data de publicação</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={save}
              disabled={saving || saved}
              className="flex items-center gap-2 rounded-md bg-white px-5 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar rascunho'}
            </button>
            {saved && (
              <Link
                href={`/clients/${clientId}/calendar`}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Ver no calendário →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
