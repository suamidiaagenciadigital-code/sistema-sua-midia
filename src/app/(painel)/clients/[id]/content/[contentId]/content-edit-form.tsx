'use client'

import { useState, useRef } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { updateContentAction } from './actions'

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

interface ContentData {
  id: string
  title: string
  type: string
  caption: string | null
  script: string | null
  image_prompt: string | null
  generated_image_url: string | null
  media_urls: string[] | null
  cta: string | null
  partner_mentioned: string | null
  scheduled_date: string | null
  revision_notes: string | null
  reel_scenes: ReelScene[] | null
  carousel_cards: CarouselCard[] | null
}

const base = "w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"

function ScenesEditor({ initial }: { initial: ReelScene[] | null }) {
  const [scenes, setScenes] = useState<ReelScene[]>(initial ?? [])

  const add = () => setScenes(prev => [
    ...prev,
    { scene: prev.length + 1, visual_prompt: '', narration: '' }
  ])
  const remove = (i: number) => setScenes(prev =>
    prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, scene: idx + 1 }))
  )
  const update = (i: number, key: keyof ReelScene, val: string) =>
    setScenes(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: val } : s))

  return (
    <div className="space-y-3">
      <input type="hidden" name="reel_scenes_json" value={JSON.stringify(scenes)} />

      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Cenas do Reel
          <span className="ml-2 normal-case text-zinc-600 font-normal">({scenes.length} cena{scenes.length !== 1 ? 's' : ''} · ~{scenes.length * 8}s)</span>
        </label>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded px-2 py-1 transition-colors"
        >
          <Plus className="h-3 w-3" /> Cena
        </button>
      </div>

      {scenes.length === 0 && (
        <p className="text-xs text-zinc-600 italic">Nenhuma cena adicionada. Clique em "+ Cena" para começar.</p>
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
            <label className="text-xs text-zinc-500">Prompt visual (Midjourney/DALL-E)</label>
            <textarea
              rows={2}
              value={s.visual_prompt}
              onChange={e => update(i, 'visual_prompt', e.target.value)}
              placeholder="Ex: Barbeiro aplicando navalha em barba densa, close no rosto, iluminação dourada..."
              className={base + ' resize-none'}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">Narração (texto falado)</label>
            <textarea
              rows={2}
              value={s.narration}
              onChange={e => update(i, 'narration', e.target.value)}
              placeholder="Ex: Sabia que a navalha dá o acabamento mais afiado possível?"
              className={base + ' resize-none'}
            />
          </div>
        </div>
      ))}

      {scenes.length > 0 && (
        <button
          type="button"
          onClick={add}
          className="w-full rounded-md border border-dashed border-zinc-700 py-2 text-xs text-zinc-600 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
        >
          + Adicionar cena
        </button>
      )}
    </div>
  )
}

function CardsEditor({ initial }: { initial: CarouselCard[] | null }) {
  const [cards, setCards] = useState<CarouselCard[]>(initial ?? [])

  const add = () => setCards(prev => [
    ...prev,
    { card: prev.length + 1, hook: '', image_prompt: '', caption: '' }
  ])
  const remove = (i: number) => setCards(prev =>
    prev.filter((_, idx) => idx !== i).map((c, idx) => ({ ...c, card: idx + 1 }))
  )
  const update = (i: number, key: keyof CarouselCard, val: string) =>
    setCards(prev => prev.map((c, idx) => idx === i ? { ...c, [key]: val } : c))

  return (
    <div className="space-y-3">
      <input type="hidden" name="carousel_cards_json" value={JSON.stringify(cards)} />

      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Cards do Carrossel
          <span className="ml-2 normal-case text-zinc-600 font-normal">({cards.length} slide{cards.length !== 1 ? 's' : ''})</span>
        </label>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded px-2 py-1 transition-colors"
        >
          <Plus className="h-3 w-3" /> Card
        </button>
      </div>

      {cards.length === 0 && (
        <p className="text-xs text-zinc-600 italic">Nenhum card adicionado. Clique em "+ Card" para começar.</p>
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
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">Hook / Título do slide</label>
            <input
              type="text"
              value={c.hook}
              onChange={e => update(i, 'hook', e.target.value)}
              placeholder={i === 0 ? 'Ex: 5 erros que destroem qualquer barba 🪒' : 'Ex: Erro #1 — Usar navalha sem preparo'}
              className={base}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">Prompt de imagem do slide</label>
            <textarea
              rows={2}
              value={c.image_prompt}
              onChange={e => update(i, 'image_prompt', e.target.value)}
              placeholder="Ex: Layout escuro com tipografia dourada, foto de barba bem cuidada ao fundo..."
              className={base + ' resize-none'}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">Texto do slide</label>
            <textarea
              rows={2}
              value={c.caption}
              onChange={e => update(i, 'caption', e.target.value)}
              placeholder="Ex: Sem preparo a pele fica seca e a navalha arranha. Use gel ou óleo antes."
              className={base + ' resize-none'}
            />
          </div>
        </div>
      ))}

      {cards.length > 0 && (
        <button
          type="button"
          onClick={add}
          className="w-full rounded-md border border-dashed border-zinc-700 py-2 text-xs text-zinc-600 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
        >
          + Adicionar card
        </button>
      )}
    </div>
  )
}

export function ContentEditForm({
  clientId,
  contentId,
  content,
}: {
  clientId: string
  contentId: string
  content: ContentData
}) {
  const update = updateContentAction.bind(null, clientId, contentId)
  const [showPrompts, setShowPrompts] = useState(!!(content.image_prompt))

  return (
    <form action={update} className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
      <h2 className="text-sm font-semibold text-white">Conteúdo</h2>

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Título / Tema</label>
        <input type="text" name="title" defaultValue={content.title} className={base} />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Copy / Legenda</label>
        <textarea name="caption" rows={6} defaultValue={content.caption ?? ''} className={base} />
      </div>

      {(content.type === 'reel' || content.type === 'carrossel') && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
            {content.type === 'carrossel' ? 'Estrutura geral dos slides' : 'Roteiro completo'}
            <span className="ml-2 normal-case text-zinc-600 font-normal">(texto livre)</span>
          </label>
          <textarea name="script" rows={5} defaultValue={content.script ?? ''} className={base} />
        </div>
      )}

      {/* Cenas (Reel) */}
      {content.type === 'reel' && (
        <ScenesEditor initial={content.reel_scenes} />
      )}

      {/* Cards (Carrossel) */}
      {content.type === 'carrossel' && (
        <CardsEditor initial={content.carousel_cards} />
      )}

      {/* URLs de mídia */}
      {content.type === 'carrossel' ? (
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">URLs dos slides (uma por linha)</label>
          <textarea
            name="media_urls_text"
            rows={5}
            defaultValue={(content.media_urls ?? []).join('\n')}
            placeholder={'https://drive.google.com/file/d/ID1/view\nhttps://drive.google.com/file/d/ID2/view'}
            className={base}
          />
          <p className="text-xs text-zinc-500">Cole um link do Google Drive por linha.</p>
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
            {content.type === 'reel' ? 'URL do vídeo (Google Drive)' : 'URL do criativo (imagem)'}
          </label>
          <input
            type="url"
            name="generated_image_url"
            defaultValue={content.generated_image_url ?? ''}
            placeholder="https://drive.google.com/file/d/.../view"
            className={base}
          />
          {content.generated_image_url && (
            <a href={content.generated_image_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
              Ver criativo atual
            </a>
          )}
        </div>
      )}

      {/* Prompts — toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowPrompts(v => !v)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {showPrompts ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {showPrompts ? 'Ocultar campos de prompt' : 'Mostrar campos de prompt (IA)'}
        </button>
      </div>

      {showPrompts && (
        <div className="space-y-4 pt-1 border-t border-zinc-800">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Prompt de imagem</label>
            <textarea name="image_prompt" rows={3} defaultValue={content.image_prompt ?? ''} className={base} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">CTA</label>
          <input type="text" name="cta" defaultValue={content.cta ?? ''} className={base} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Parceiro mencionado</label>
          <input type="text" name="partner_mentioned" defaultValue={content.partner_mentioned ?? ''} className={base} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Data de publicação</label>
          <input type="date" name="scheduled_date" defaultValue={content.scheduled_date ?? ''} className={base} />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Notas de revisão</label>
        <textarea name="revision_notes" rows={2} defaultValue={content.revision_notes ?? ''} className={base} />
      </div>

      <button
        type="submit"
        className="rounded-md bg-white px-5 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors"
      >
        Salvar alterações
      </button>
    </form>
  )
}
