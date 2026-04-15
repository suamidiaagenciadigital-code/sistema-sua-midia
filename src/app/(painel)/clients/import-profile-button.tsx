'use client'

import { useRef, useState } from 'react'
import { FileUp, CheckCircle2, AlertCircle, X } from 'lucide-react'

interface ProfileJson {
  name?: string
  niche?: string
  location?: string
  brand_profile?: {
    voice_tone?: string
    target_audience?: string
    main_services?: string[]
    differentials?: string[]
    visual_identity?: string
    cta_style?: string
    hashtags_base?: string[]
    content_pillars?: { pillar: string; description: string; percentage?: number }[]
    avoid?: string[]
    examples_tone?: string
    posting_frequency?: string
  }
  marketing_goals?: string[]
  notes?: string
}

/** Preenche um input ou textarea nativo (dispara React onChange corretamente) */
function fillField(name: string, value: string) {
  const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    `[name="${name}"]`
  )
  if (!el || !value) return
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
    'value'
  )?.set
  nativeInputValueSetter?.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

export function ImportClientProfileButton() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('idle')
    setMessage('')

    try {
      const text = await file.text()
      const data: ProfileJson = JSON.parse(text)

      const bp = data.brand_profile ?? {}

      // ── Identidade ──────────────────────────────────────────
      if (data.name)  fillField('name',  data.name)
      if (data.niche) fillField('niche', data.niche)

      // ── Público e posicionamento ─────────────────────────────
      if (bp.target_audience) fillField('target_audience', bp.target_audience)

      if (bp.differentials?.length)
        fillField('differentials', bp.differentials.join('\n'))

      // ── Tom de voz ───────────────────────────────────────────
      if (bp.voice_tone) fillField('tone_of_voice', bp.voice_tone)

      if (bp.hashtags_base?.length)
        fillField('brand_keywords', bp.hashtags_base.join(', '))

      if (bp.avoid?.length)
        fillField('forbidden_words', bp.avoid.join(', '))

      // ── Catálogo e notas para IA ─────────────────────────────
      if (bp.main_services?.length)
        fillField('catalog', bp.main_services.join('\n'))

      // Montar ai_notes com pilares + CTA + exemplos + notas
      const aiLines: string[] = []
      if (bp.content_pillars?.length) {
        aiLines.push('PILARES DE CONTEÚDO:')
        bp.content_pillars.forEach(p =>
          aiLines.push(`• ${p.pillar}${p.percentage ? ` (${p.percentage}%)` : ''}: ${p.description}`)
        )
      }
      if (bp.cta_style) aiLines.push(`\nESTILO DE CTA: ${bp.cta_style}`)
      if (bp.examples_tone) aiLines.push(`\nEXEMPLO DE TOM: "${bp.examples_tone}"`)
      if (bp.posting_frequency) aiLines.push(`\nFREQUÊNCIA: ${bp.posting_frequency}`)
      if (data.notes) aiLines.push(`\nOBSERVAÇÕES: ${data.notes}`)
      if (aiLines.length) fillField('ai_notes', aiLines.join('\n'))

      // ── Contrato ─────────────────────────────────────────────
      if (data.marketing_goals?.length)
        fillField('monthly_goal', data.marketing_goals.join('\n'))

      // ── Identidade visual ─────────────────────────────────────
      if (bp.visual_identity) fillField('visual_references', bp.visual_identity)

      setStatus('ok')
      setMessage('Perfil importado! Revise os campos e salve.')
    } catch {
      setStatus('error')
      setMessage('Erro ao ler o arquivo. Certifique-se que é um JSON gerado pela skill perfil-cliente.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-300">Importar perfil via JSON</p>
        <p className="text-xs text-zinc-500 mt-0.5">
          Use a skill <span className="font-mono text-zinc-400">/perfil-cliente</span> no Claude, exporte o JSON e importe aqui para preencher o formulário automaticamente.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {status === 'ok' && (
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {message}
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="max-w-[200px]">{message}</span>
          </div>
        )}

        <input ref={inputRef} type="file" accept=".json" onChange={handleFile} className="hidden" />
        <button
          type="button"
          onClick={() => {
            setStatus('idle')
            inputRef.current?.click()
          }}
          className="flex items-center gap-2 rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:text-white hover:border-zinc-400 hover:bg-zinc-700 transition-colors whitespace-nowrap"
        >
          <FileUp className="h-4 w-4" />
          Importar perfil (.json)
        </button>
      </div>
    </div>
  )
}
