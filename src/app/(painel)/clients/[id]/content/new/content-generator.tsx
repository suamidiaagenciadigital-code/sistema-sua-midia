'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, Sparkles, Save, RefreshCw, Plus, Trash2, PenLine, ChevronDown, ChevronUp, FileUp, AlertCircle } from 'lucide-react'

interface Generated {
  title: string
  caption: string
  script: string | null
  image_prompt: string
  cta: string
  partner_mentioned: string | null
  reel_scenes?: ReelScene[] | null
  carousel_cards?: CarouselCard[] | null
}

interface ReelScene {
  scene: number
  visual_prompt: string
  narration: string
}

interface CarouselCard {
  card: number
  hook: string
  image_prompt: string
  caption: string
}

const contentTypes = [
  { value: 'reel', label: 'Reel', desc: 'Vídeo vertical ~30-60s' },
  { value: 'carrossel', label: 'Carrossel', desc: '5-8 slides educativos' },
  { value: 'feed', label: 'Feed', desc: 'Post de imagem' },
  { value: 'story', label: 'Story', desc: 'Conteúdo efêmero' },
]

const base = "w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"

// ── Componentes de cenas/cards ────────────────────────────────

function ScenesEditor({ scenes, setScenes }: { scenes: ReelScene[]; setScenes: (s: ReelScene[]) => void }) {
  const add = () => setScenes([...scenes, { scene: scenes.length + 1, visual_prompt: '', narration: '' }])
  const remove = (i: number) =>
    setScenes(scenes.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, scene: idx + 1 })))
  const update = (i: number, key: keyof ReelScene, val: string) =>
    setScenes(scenes.map((s, idx) => idx === i ? { ...s, [key]: val } : s))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Cenas do Reel
          <span className="ml-2 normal-case text-zinc-600 font-normal">
            ({scenes.length} cena{scenes.length !== 1 ? 's' : ''} · ~{scenes.length * 8}s)
          </span>
        </label>
        <button type="button" onClick={add}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded px-2 py-1 transition-colors">
          <Plus className="h-3 w-3" /> Cena
        </button>
      </div>
      {scenes.length === 0 && (
        <p className="text-xs text-zinc-600 italic">Nenhuma cena. Clique em "+ Cena" para começar.</p>
      )}
      {scenes.map((s, i) => (
        <div key={i} className="rounded-md border border-zinc-700 bg-zinc-800/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">Cena {s.scene}</span>
            <button type="button" onClick={() => remove(i)} className="text-zinc-600 hover:text-red-400 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">Prompt visual</label>
            <textarea rows={2} value={s.visual_prompt} onChange={e => update(i, 'visual_prompt', e.target.value)}
              placeholder="Descreva o visual da cena para geração de imagem/vídeo"
              className={base + ' resize-none'} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">Narração</label>
            <textarea rows={2} value={s.narration} onChange={e => update(i, 'narration', e.target.value)}
              placeholder="Texto falado nesta cena"
              className={base + ' resize-none'} />
          </div>
        </div>
      ))}
      {scenes.length > 0 && (
        <button type="button" onClick={add}
          className="w-full rounded-md border border-dashed border-zinc-700 py-2 text-xs text-zinc-600 hover:text-zinc-300 hover:border-zinc-500 transition-colors">
          + Adicionar cena
        </button>
      )}
    </div>
  )
}

function CardsEditor({ cards, setCards }: { cards: CarouselCard[]; setCards: (c: CarouselCard[]) => void }) {
  const add = () => setCards([...cards, { card: cards.length + 1, hook: '', image_prompt: '', caption: '' }])
  const remove = (i: number) =>
    setCards(cards.filter((_, idx) => idx !== i).map((c, idx) => ({ ...c, card: idx + 1 })))
  const update = (i: number, key: keyof CarouselCard, val: string) =>
    setCards(cards.map((c, idx) => idx === i ? { ...c, [key]: val } : c))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Cards do Carrossel
          <span className="ml-2 normal-case text-zinc-600 font-normal">
            ({cards.length} slide{cards.length !== 1 ? 's' : ''})
          </span>
        </label>
        <button type="button" onClick={add}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded px-2 py-1 transition-colors">
          <Plus className="h-3 w-3" /> Card
        </button>
      </div>
      {cards.length === 0 && (
        <p className="text-xs text-zinc-600 italic">Nenhum card. Clique em "+ Card" para começar.</p>
      )}
      {cards.map((c, i) => (
        <div key={i} className="rounded-md border border-zinc-700 bg-zinc-800/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">
              {i === 0 ? '🎯 Capa (Card 1)' : `Card ${c.card}`}
            </span>
            <button type="button" onClick={() => remove(i)} className="text-zinc-600 hover:text-red-400 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <input type="text" value={c.hook} onChange={e => update(i, 'hook', e.target.value)}
            placeholder={i === 0 ? 'Hook / título da capa' : 'Título do card'}
            className={base} />
          <textarea rows={2} value={c.image_prompt} onChange={e => update(i, 'image_prompt', e.target.value)}
            placeholder="Prompt de imagem do slide"
            className={base + ' resize-none'} />
          <textarea rows={2} value={c.caption} onChange={e => update(i, 'caption', e.target.value)}
            placeholder="Texto do slide"
            className={base + ' resize-none'} />
        </div>
      ))}
      {cards.length > 0 && (
        <button type="button" onClick={add}
          className="w-full rounded-md border border-dashed border-zinc-700 py-2 text-xs text-zinc-600 hover:text-zinc-300 hover:border-zinc-500 transition-colors">
          + Adicionar card
        </button>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────

export default function ContentGenerator({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [mode, setMode] = useState<'ai' | 'manual'>('ai')
  const [type, setType] = useState('reel')
  const [theme, setTheme] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Conteúdo gerado / editado (ambos os modos)
  const [edited, setEdited] = useState<Generated | null>(null)
  const [scheduledDate, setScheduledDate] = useState('')

  // Estado das cenas/cards (manuais)
  const [scenes, setScenes] = useState<ReelScene[]>([])
  const [cards, setCards] = useState<CarouselCard[]>([])
  const [showPrompts, setShowPrompts] = useState(false)
  const [importError, setImportError] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  // Manual: inicializar campos vazios
  const initManual = () => {
    setEdited({ title: '', caption: '', script: null, image_prompt: '', cta: '', partner_mentioned: null })
    setScenes([])
    setCards([])
    setSaved(false)
    setError('')
  }

  const switchMode = (m: 'ai' | 'manual') => {
    setMode(m)
    setImportError('')
    if (m === 'manual') initManual()
    else setEdited(null)
  }

  // Import de conteúdo único via JSON
  const importFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError('')
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // Aceita tanto objeto único quanto { contents: [...] } com 1 item
      const item = Array.isArray(data.contents) ? data.contents[0] : data

      if (!item?.title) {
        setImportError('JSON inválido. O arquivo deve ter um campo "title".')
        return
      }

      // Preencher tipo (se válido)
      const validTypes = ['feed', 'reel', 'story', 'carrossel', 'imagem']
      if (item.type && validTypes.includes(item.type)) setType(item.type)

      setEdited({
        title: item.title ?? '',
        caption: item.caption ?? '',
        script: item.script ?? null,
        image_prompt: item.image_prompt ?? '',
        cta: item.cta ?? '',
        partner_mentioned: item.partner_mentioned ?? null,
      })

      if (item.scheduled_date) setScheduledDate(item.scheduled_date)
      if (Array.isArray(item.reel_scenes) && item.reel_scenes.length > 0) setScenes(item.reel_scenes)
      if (Array.isArray(item.carousel_cards) && item.carousel_cards.length > 0) setCards(item.carousel_cards)
      if (item.image_prompt) setShowPrompts(true)

    } catch {
      setImportError('Erro ao ler o arquivo. Certifique-se que é um JSON válido.')
    } finally {
      if (importRef.current) importRef.current.value = ''
    }
  }

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
      setEdited(data)
      // Preencher cenas/cards se a IA retornar
      if (data.reel_scenes) setScenes(data.reel_scenes)
      if (data.carousel_cards) setCards(data.carousel_cards)
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
      const payload = {
        client_id: clientId,
        type,
        scheduled_date: scheduledDate || null,
        status: 'draft',
        ...edited,
        reel_scenes: type === 'reel' && scenes.length > 0 ? scenes : null,
        carousel_cards: type === 'carrossel' && cards.length > 0 ? cards : null,
      }
      const res = await fetch('/api/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) setSaved(true)
    } catch {
      setError('Erro ao salvar conteúdo.')
    } finally {
      setSaving(false)
    }
  }

  const setField = (key: keyof Generated, val: string) =>
    setEdited(prev => prev ? { ...prev, [key]: val } : prev)

  const inputField = (label: string, key: keyof Generated, placeholder = '') => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">{label}</label>
      <input type="text" value={(edited?.[key] as string) ?? ''} onChange={e => setField(key, e.target.value)}
        placeholder={placeholder} className={base} />
    </div>
  )

  const textareaField = (label: string, key: keyof Generated, rows = 3, placeholder = '') => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">{label}</label>
      <textarea rows={rows} value={(edited?.[key] as string) ?? ''} onChange={e => setField(key, e.target.value)}
        placeholder={placeholder} className={base + ' resize-none'} />
    </div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/clients/${clientId}`} className="text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Novo conteúdo</h1>
          <p className="text-zinc-400 text-sm mt-0.5">{clientName}</p>
        </div>
      </div>

      {/* Modo: IA ou Manual */}
      <div className="flex gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        <button
          type="button"
          onClick={() => switchMode('ai')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === 'ai' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Gerar com IA
        </button>
        <button
          type="button"
          onClick={() => switchMode('manual')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === 'manual' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <PenLine className="h-4 w-4" />
          Criar manualmente
        </button>
      </div>

      {/* Tipo de conteúdo (compartilhado) */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Tipo de conteúdo</label>
          <div className="grid grid-cols-4 gap-2">
            {contentTypes.map(ct => (
              <button key={ct.value} type="button" onClick={() => {
                setType(ct.value)
                setScenes([])
                setCards([])
              }}
                className={`rounded-md border p-3 text-left transition-colors ${
                  type === ct.value ? 'border-white bg-zinc-700 text-white' : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white'
                }`}
              >
                <div className="text-sm font-medium">{ct.label}</div>
                <div className="text-xs mt-0.5 opacity-70">{ct.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Modo IA */}
        {mode === 'ai' && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                Tema / gancho <span className="normal-case text-zinc-600">(opcional — a IA escolhe se deixar vazio)</span>
              </label>
              <input type="text" value={theme} onChange={e => setTheme(e.target.value)}
                placeholder="Ex: Dia do noivo, barba perfeita, experiência premium..."
                className={base} />
            </div>

            <button onClick={generate} disabled={loading}
              className="flex items-center gap-2 rounded-md bg-white px-5 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <><RefreshCw className="h-4 w-4 animate-spin" /> Gerando...</> : <><Sparkles className="h-4 w-4" /> Gerar com IA</>}
            </button>
          </>
        )}

        {/* Modo Manual — importar JSON */}
        {mode === 'manual' && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">
              Preencha os campos abaixo manualmente, ou importe um JSON gerado no chat do Claude.
            </p>
            <input ref={importRef} type="file" accept=".json" onChange={importFromFile} className="hidden" />
            <button
              type="button"
              onClick={() => importRef.current?.click()}
              className="flex items-center gap-2 rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
            >
              <FileUp className="h-4 w-4" />
              Importar conteúdo (.json)
            </button>
            {importError && (
              <div className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {importError}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {/* Formulário de edição (IA gerado OU manual) */}
      {edited !== null && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              {mode === 'ai' ? 'Conteúdo gerado — edite antes de salvar' : 'Preencha o conteúdo'}
            </h2>
            {mode === 'ai' && (
              <button onClick={generate} disabled={loading}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
                <RefreshCw className="h-3.5 w-3.5" /> Regenerar
              </button>
            )}
          </div>

          {inputField('Título / Tema', 'title', 'Ex: Barba do mês — o look mais pedido')}
          {textareaField('Copy / Legenda', 'caption', 6, 'Legenda completa com emojis e hashtags')}

          {(type === 'reel' || type === 'carrossel') && (
            textareaField(
              type === 'carrossel' ? 'Estrutura geral dos slides' : 'Roteiro completo',
              'script', 5,
              type === 'carrossel' ? 'Descreva a sequência dos slides...' : 'Descreva o roteiro do vídeo...'
            )
          )}

          {/* Cenas (Reel) */}
          {type === 'reel' && <ScenesEditor scenes={scenes} setScenes={setScenes} />}

          {/* Cards (Carrossel) */}
          {type === 'carrossel' && <CardsEditor cards={cards} setCards={setCards} />}

          {/* Prompts toggle */}
          <div>
            <button type="button" onClick={() => setShowPrompts(v => !v)}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              {showPrompts ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {showPrompts ? 'Ocultar campos de prompt' : 'Mostrar campos de prompt (IA)'}
            </button>
          </div>

          {showPrompts && (
            <div className="border-t border-zinc-800 pt-4">
              {textareaField('Prompt de imagem (para geração visual)', 'image_prompt', 3, 'Descreva o visual para Midjourney/DALL-E')}
            </div>
          )}

          {inputField('CTA', 'cta', 'Ex: Agende pelo link na bio')}
          {inputField('Parceiro mencionado', 'partner_mentioned', 'Ex: @parceiro')}

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Data de publicação</label>
            <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500" />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button onClick={save} disabled={saving || saved}
              className="flex items-center gap-2 rounded-md bg-white px-5 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors disabled:opacity-50">
              <Save className="h-4 w-4" />
              {saved ? '✓ Salvo!' : saving ? 'Salvando...' : 'Salvar rascunho'}
            </button>
            {saved && (
              <Link href={`/clients/${clientId}/calendar`} className="text-sm text-zinc-400 hover:text-white transition-colors">
                Ver no calendário →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
