'use client'

import { useState, useRef } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Send, Loader2, Upload } from 'lucide-react'
import { updateContentAction } from './actions'
import { SubmitButton } from '../../../../_components/submit-button'
// ── Upload direto do browser para Supabase via URL assinada ──────────────
function VideoUploadField({
  clientId,
  value,
  onChange,
  base,
}: {
  clientId: string
  value: string
  onChange: (url: string) => void
  base: string
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      // 1. Pedir URL assinada ao servidor (usa service key, bypass RLS)
      const presignResp = await fetch('/api/media/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, fileName: file.name, contentType: file.type }),
      })
      if (!presignResp.ok) {
        const err = await presignResp.json()
        throw new Error(err.error ?? 'Erro ao gerar URL de upload')
      }
      const { signedUrl, publicUrl } = await presignResp.json()

      // 2. Upload direto para o Supabase usando a URL assinada (sem passar pelo Vercel)
      const uploadResp = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadResp.ok) throw new Error('Falha no upload para o storage')

      // 3. Registrar metadados no banco
      await fetch('/api/media/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          file_url: publicUrl,
          file_type: 'video',
          original_name: file.name,
          size_bytes: file.size,
          tags: ['reel'],
        }),
      })

      onChange(publicUrl)
    } catch (err: any) {
      setUploadError(err.message ?? 'Erro no upload')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="url"
          name="generated_image_url"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Cole o link do Supabase ou use o botão abaixo"
          className={base + ' flex-1'}
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium transition-colors"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? 'Enviando vídeo...' : 'Subir vídeo do computador'}
        </button>
        <span className="text-xs text-zinc-500">MP4, MOV, WebM</span>
      </div>
      <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
      {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
      {value && value.includes('supabase') && (
        <p className="text-xs text-green-400">✓ Vídeo hospedado no Supabase — pronto para Instagram</p>
      )}
    </div>
  )
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
  scheduled_time: string | null
  revision_notes: string | null
  reel_scenes: ReelScene[] | null
  carousel_cards: CarouselCard[] | null
}

const base = "w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"

const TYPE_EMOJI: Record<string, string> = {
  reel: '🎬', carrossel: '🗂️', imagem: '📷', story: '📲',
}

// Resolve Google Drive URL para exibição direta
function resolveImageUrl(url: string): string {
  const match = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([^/?&]+)/)
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`
  return url
}

// Resolve Google Drive URL para embed de vídeo
function getDriveEmbedUrl(url: string): string {
  const match = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)
  if (match) return `https://drive.google.com/file/d/${match[1]}/preview`
  return url
}

// ── Preview Panel ─────────────────────────────────────────────

function PreviewPanel({
  clientName,
  type,
  caption,
  imageUrl,
  mediaUrlsText,
}: {
  clientName: string
  type: string
  caption: string
  imageUrl: string
  mediaUrlsText: string
}) {
  const initials = clientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const isReel = type === 'reel'
  const isCarousel = type === 'carrossel'
  const isStory = type === 'story'
  const mediaUrls = isCarousel
    ? mediaUrlsText.split('\n').map(u => u.trim()).filter(Boolean)
    : []
  const [activeSlide, setActiveSlide] = useState(0)
  const hasContent = caption.trim() || imageUrl.trim()

  return (
    <div className="sticky top-6 space-y-3">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Preview</p>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        {isStory ? (
          /* ── Story: 9/16, só imagem ── */
          imageUrl.trim() ? (
            <div className="w-full bg-zinc-900" style={{ aspectRatio: '9/16' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImageUrl(imageUrl)}
                alt="Story preview"
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          ) : (
            <div className="w-full bg-zinc-800 flex flex-col items-center justify-center gap-2" style={{ aspectRatio: '9/16' }}>
              <span className="text-4xl opacity-20">📲</span>
              <p className="text-zinc-600 text-xs">1080 × 1920</p>
            </div>
          )
        ) : !hasContent ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-3">
            <span className="text-3xl opacity-30">{TYPE_EMOJI[type] ?? '📄'}</span>
            <p className="text-zinc-600 text-xs">O preview aparece aqui quando você adicionar uma imagem ou legenda</p>
          </div>
        ) : (
          <>
            {/* Post header */}
            <div className="flex items-center gap-2.5 px-3 py-3 border-b border-zinc-800">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold leading-tight truncate">{clientName}</p>
                <p className="text-zinc-500 text-[11px]">{TYPE_EMOJI[type]} {type}</p>
              </div>
            </div>

            {/* Mídia */}
            {isCarousel && mediaUrls.length > 0 ? (
              <div>
                <div className="w-full bg-zinc-800" style={{ aspectRatio: '4/5' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveImageUrl(mediaUrls[activeSlide] ?? '')}
                    alt={`Slide ${activeSlide + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {mediaUrls.length > 1 && (
                  <div className="flex items-center justify-center gap-1.5 py-2">
                    {mediaUrls.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveSlide(i)}
                        className={`rounded-full transition-all ${i === activeSlide ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-zinc-600 hover:bg-zinc-400'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : isReel && imageUrl.trim() ? (
              <div className="w-full bg-black" style={{ position: 'relative', paddingBottom: '177.78%', height: 0, overflow: 'hidden' }}>
                <iframe
                  src={getDriveEmbedUrl(imageUrl)}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                />
              </div>
            ) : imageUrl.trim() ? (
              <div className="w-full bg-zinc-800" style={{ aspectRatio: '4/5' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveImageUrl(imageUrl)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            ) : (
              <div className="w-full bg-zinc-800 flex flex-col items-center justify-center gap-2" style={{ aspectRatio: '4/5' }}>
                <span className="text-4xl opacity-20">{TYPE_EMOJI[type] ?? '📄'}</span>
                <p className="text-zinc-600 text-xs">Nenhuma mídia anexada</p>
              </div>
            )}

            {/* Caption */}
            {caption && (
              <div className="px-3 pt-3 pb-4">
                <p className="text-xs text-white leading-relaxed">
                  <span className="font-semibold">{clientName} </span>
                  <span className="text-zinc-300 whitespace-pre-wrap">{caption}</span>
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <p className="text-[11px] text-zinc-600 text-center">Preview atualiza em tempo real</p>
    </div>
  )
}

// ── Cenas (Reel) ──────────────────────────────────────────────

function ScenesEditor({ initial }: { initial: ReelScene[] | null }) {
  const [scenes, setScenes] = useState<ReelScene[]>(initial ?? [])

  const add = () => setScenes(prev => [...prev, { scene: prev.length + 1, visual_prompt: '', narration: '' }])
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
        <button type="button" onClick={add}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded px-2 py-1 transition-colors">
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
            <label className="text-xs text-zinc-500">Prompt visual</label>
            <textarea rows={2} value={s.visual_prompt} onChange={e => update(i, 'visual_prompt', e.target.value)}
              placeholder="Descreva o visual da cena..."
              className={base + ' resize-none'} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">Narração</label>
            <textarea rows={2} value={s.narration} onChange={e => update(i, 'narration', e.target.value)}
              placeholder="Texto falado nesta cena..."
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

// ── Cards (Carrossel) ─────────────────────────────────────────

function CardsEditor({ initial }: { initial: CarouselCard[] | null }) {
  const [cards, setCards] = useState<CarouselCard[]>(initial ?? [])

  const add = () => setCards(prev => [...prev, { card: prev.length + 1, hook: '', image_prompt: '', caption: '' }])
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
        <button type="button" onClick={add}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded px-2 py-1 transition-colors">
          <Plus className="h-3 w-3" /> Card
        </button>
      </div>
      {cards.length === 0 && (
        <p className="text-xs text-zinc-600 italic">Nenhum card adicionado.</p>
      )}
      {cards.map((c, i) => (
        <div key={i} className="rounded-md border border-zinc-700 bg-zinc-800/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">{i === 0 ? '🎯 Capa (Card 1)' : `Card ${c.card}`}</span>
            <button type="button" onClick={() => remove(i)} className="text-zinc-600 hover:text-red-400 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <input type="text" value={c.hook} onChange={e => update(i, 'hook', e.target.value)}
            placeholder={i === 0 ? 'Hook / título da capa' : 'Título do card'} className={base} />
          <textarea rows={2} value={c.image_prompt} onChange={e => update(i, 'image_prompt', e.target.value)}
            placeholder="Prompt de imagem do slide" className={base + ' resize-none'} />
          <textarea rows={2} value={c.caption} onChange={e => update(i, 'caption', e.target.value)}
            placeholder="Texto do slide" className={base + ' resize-none'} />
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

export function ContentEditForm({
  clientId,
  clientName,
  contentId,
  content,
}: {
  clientId: string
  clientName: string
  contentId: string
  content: ContentData
}) {
  const update = updateContentAction.bind(null, clientId, contentId)
  const [showPrompts, setShowPrompts] = useState(!!(content.image_prompt))

  // Estado para o preview em tempo real
  const [caption, setCaption] = useState(content.caption ?? '')
  const [imageUrl, setImageUrl] = useState(content.generated_image_url ?? '')
  const [mediaUrlsText, setMediaUrlsText] = useState((content.media_urls ?? []).join('\n'))
  const [scheduledTime, setScheduledTime] = useState(content.scheduled_time ?? '09:00')

  // Estado do botão Publicar agora
  const [publishing, setPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const publishNow = async () => {
    if (!confirm('Publicar este conteúdo agora no Facebook e Instagram? Esta ação não pode ser desfeita.')) return
    setPublishing(true)
    setPublishResult(null)
    try {
      const res = await fetch(`/api/contents/${contentId}/publish-now`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao publicar')
      setPublishResult({ ok: true, msg: 'Publicado com sucesso!' })
    } catch (e) {
      setPublishResult({ ok: false, msg: e instanceof Error ? e.message : 'Erro ao publicar' })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[65%_35%] gap-6 items-start">

      {/* ── Formulário ── */}
      <form action={update} className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        {/* Campo hidden para o servidor saber o tipo ao re-hospedar vídeos */}
        <input type="hidden" name="type" value={content.type} />
        <h2 className="text-sm font-semibold text-white">Conteúdo</h2>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Título / Tema</label>
          <input type="text" name="title" defaultValue={content.title} className={base} />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Copy / Legenda</label>
          <textarea
            name="caption"
            rows={6}
            value={caption}
            onChange={e => setCaption(e.target.value)}
            className={base}
          />
        </div>

        {/* Story: múltiplas mídias (uma por linha) */}
        {content.type === 'story' ? (
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Links das mídias (1080×1920) — uma por linha</label>
            <textarea
              name="media_urls_text"
              rows={3}
              value={mediaUrlsText}
              onChange={e => { setMediaUrlsText(e.target.value); setImageUrl(e.target.value.split('\n')[0]?.trim() ?? '') }}
              placeholder={'https://drive.google.com/file/d/ID1/view\nhttps://drive.google.com/file/d/ID2/view'}
              className={base + ' resize-none'}
            />
            <input type="hidden" name="generated_image_url" value={imageUrl} />
            <p className="text-xs text-zinc-500">Cole um link por linha. Cada linha vira um frame do story. O preview mostra o primeiro.</p>
          </div>
        ) : (
          <>
            {(content.type === 'reel' || content.type === 'carrossel') && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                  {content.type === 'carrossel' ? 'Estrutura geral dos slides' : 'Roteiro completo'}
                  <span className="ml-2 normal-case text-zinc-600 font-normal">(texto livre)</span>
                </label>
                <textarea name="script" rows={5} defaultValue={content.script ?? ''} className={base} />
              </div>
            )}

            {content.type === 'reel' && <ScenesEditor initial={content.reel_scenes} />}
            {content.type === 'carrossel' && <CardsEditor initial={content.carousel_cards} />}

            {/* URLs de mídia */}
            {content.type === 'carrossel' ? (
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">URLs dos slides (uma por linha)</label>
                <textarea
                  name="media_urls_text"
                  rows={5}
                  value={mediaUrlsText}
                  onChange={e => setMediaUrlsText(e.target.value)}
                  placeholder={'https://drive.google.com/file/d/ID1/view\nhttps://drive.google.com/file/d/ID2/view'}
                  className={base}
                />
                <p className="text-xs text-zinc-500">Cole um link do Google Drive por linha. O preview ao lado atualiza na hora.</p>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                  {content.type === 'reel' ? 'Vídeo' : 'URL do criativo (imagem)'}
                </label>
                {content.type === 'reel' ? (
                  <VideoUploadField
                    clientId={clientId}
                    value={imageUrl}
                    onChange={setImageUrl}
                    base={base}
                  />
                ) : (
                  <input
                    type="url"
                    name="generated_image_url"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view"
                    className={base}
                  />
                )}
                <p className="text-xs text-zinc-500">O preview ao lado atualiza automaticamente ao colar o link.</p>
              </div>
            )}

            {/* Prompts toggle */}
            <div>
              <button type="button" onClick={() => setShowPrompts(v => !v)}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
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
          </>
        )}

        {/* Data + Hora de publicação */}
        <div className="rounded-md border border-zinc-700 bg-zinc-800/40 p-3 space-y-2">
          <label className="text-xs font-medium text-zinc-300 uppercase tracking-wide">Agendamento</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Data</label>
              <input type="date" name="scheduled_date" defaultValue={content.scheduled_date ?? ''} className={base} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Hora</label>
              <input
                type="time"
                name="scheduled_time"
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
                className={base}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Notas de revisão</label>
          <textarea name="revision_notes" rows={2} defaultValue={content.revision_notes ?? ''} className={base} />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-zinc-800">
          <SubmitButton className="rounded-md bg-white px-5 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100">
            Salvar alterações
          </SubmitButton>

          <button
            type="button"
            onClick={publishNow}
            disabled={publishing}
            className="flex items-center gap-2 rounded-md bg-green-700 hover:bg-green-600 disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white transition-colors"
          >
            {publishing
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Publicando...</>
              : <><Send className="h-4 w-4" /> Publicar agora</>
            }
          </button>
        </div>

        {publishResult && (
          <div className={`rounded-md px-3 py-2 text-xs font-medium ${
            publishResult.ok
              ? 'bg-green-900/30 text-green-300 border border-green-800'
              : 'bg-red-900/30 text-red-300 border border-red-800'
          }`}>
            {publishResult.ok ? '✓ ' : '✗ '}{publishResult.msg}
          </div>
        )}
      </form>

      {/* ── Preview ── */}
      <PreviewPanel
        clientName={clientName}
        type={content.type}
        caption={caption}
        imageUrl={imageUrl}
        mediaUrlsText={mediaUrlsText}
      />
    </div>
  )
}
