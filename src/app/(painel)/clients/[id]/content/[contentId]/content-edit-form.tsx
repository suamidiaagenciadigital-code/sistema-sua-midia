'use client'

import { useState, useRef } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Send, Loader2, Upload, Link2, CalendarDays } from 'lucide-react'
import { updateContentAction } from './actions'
import { SubmitButton } from '../../../../_components/submit-button'
import { createClient } from '@/lib/supabase/client'
import { useDriveRehost } from '@/lib/use-drive-rehost'

// ── Lumina input style ────────────────────────────────────────
const base = "w-full rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none transition-colors bg-white/5 border border-white/10"

// ── Upload direto do browser para Supabase via URL assinada ──
function VideoUploadField({
  clientId,
  value,
  onChange,
}: {
  clientId: string
  value: string
  onChange: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { state: rehostState, error: rehostError, isDriveUrl, rehost } = useDriveRehost(clientId)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const presignResp = await fetch('/api/media/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, fileName: file.name, contentType: file.type }),
      })
      if (!presignResp.ok) {
        const err = await presignResp.json()
        throw new Error(err.error ?? 'Erro ao gerar URL de upload')
      }
      const { path, token, publicUrl } = await presignResp.json()
      const supabase = createClient()
      const { error: uploadErr } = await supabase.storage
        .from('media')
        .uploadToSignedUrl(path, token, file, { contentType: file.type })
      if (uploadErr) throw new Error(uploadErr.message)
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
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Erro no upload')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleUrlBlur(url: string) {
    if (isDriveUrl(url)) rehost(url, onChange)
  }

  const isRehosting = rehostState === 'loading'
  const isSupabase = value && value.includes('supabase')

  return (
    <div className="space-y-2">
      {/* URL input com ícone de link */}
      <div className="relative flex items-center">
        <Link2 className="absolute left-3 h-4 w-4 text-slate-600 pointer-events-none shrink-0" />
        {isRehosting && <Loader2 className="absolute right-3 h-4 w-4 text-blue-400 animate-spin pointer-events-none" />}
        <input
          type="url"
          name="generated_image_url"
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={e => handleUrlBlur(e.target.value)}
          onPaste={e => {
            const pasted = e.clipboardData.getData('text')
            if (/drive\.google\.com/.test(pasted)) {
              setTimeout(() => rehost(pasted, onChange), 100)
            }
          }}
          placeholder="Cole o link do Drive ou Supabase"
          className={base + ' pl-9 pr-9'}
        />
      </div>
      {isRehosting && (
        <p className="text-xs text-blue-400 flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          Hospedando vídeo do Drive no Supabase...
        </p>
      )}
      {rehostState === 'done' && (
        <p className="text-xs text-emerald-400">✓ Vídeo transferido do Drive para o Supabase automaticamente</p>
      )}
      {rehostError && (
        <p className="text-xs text-red-400">Rehost: {rehostError}</p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || isRehosting}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'linear-gradient(to right, #2B80FF, #A855F7)' }}
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? 'Enviando...' : 'Subir do computador'}
        </button>
        <span className="text-xs text-slate-600">MP4, MOV, WebM</span>
      </div>
      <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
      {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
      {isSupabase && rehostState === 'idle' && (
        <p className="text-xs text-emerald-400">✓ Vídeo hospedado no Supabase — pronto para Instagram</p>
      )}
    </div>
  )
}

// ── Contador de caracteres ────────────────────────────────────
function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length
  const pct = len / max
  const color = pct > 0.9 ? '#f87171' : pct > 0.75 ? '#fbbf24' : '#475569'
  return <span className="text-xs tabular-nums" style={{ color }}>{len}/{max}</span>
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

const TYPE_EMOJI: Record<string, string> = {
  reel: '🎬', carrossel: '🗂️', imagem: '📷', story: '📲',
}

function resolveImageUrl(url: string): string {
  const match = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([^/?&]+)/)
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`
  return url
}

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
  // URLs do carrossel — exatamente igual ao carrossel
  const mediaUrls = isCarousel
    ? mediaUrlsText.split('\n').map(u => u.trim()).filter(Boolean)
    : []
  // URLs do story — mesma lógica do carrossel + fallback para imageUrl
  const storyUrls = isStory
    ? (() => {
        const parsed = mediaUrlsText.split('\n').map(u => u.trim()).filter(Boolean)
        return parsed.length > 0 ? parsed : (imageUrl.trim() ? [imageUrl] : [])
      })()
    : []
  const [activeSlide, setActiveSlide] = useState(0)
  const hasContent = caption.trim() || imageUrl.trim() || storyUrls.length > 0

  return (
    <div className="sticky top-6 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>Preview</p>

      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: '#131b2e', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {isStory ? (
          storyUrls.length > 0 ? (
            /* Idêntico ao carrossel, só muda aspectRatio para 9/16 e detecta vídeo */
            <div>
              <div className="w-full bg-black" style={{ aspectRatio: '9/16' }}>
                {storyUrls[activeSlide]?.includes('supabase') || /\.(mp4|mov|webm|m4v)(\?|$)/i.test(storyUrls[activeSlide] ?? '') ? (
                  <video
                    key={storyUrls[activeSlide]}
                    src={storyUrls[activeSlide]}
                    controls
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={resolveImageUrl(storyUrls[activeSlide] ?? '')}
                    alt={`Story ${activeSlide + 1}`}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
              </div>
              {storyUrls.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 py-2">
                  {storyUrls.map((_, i) => (
                    <button key={i} type="button" onClick={() => setActiveSlide(i)}
                      className={`rounded-full transition-all ${i === activeSlide ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-slate-600 hover:bg-slate-400'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center gap-2" style={{ aspectRatio: '9/16', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <span className="text-4xl opacity-20">📲</span>
              <p className="text-slate-600 text-xs">1080 × 1920</p>
            </div>
          )
        ) : !hasContent ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 gap-3">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(43,128,255,0.15), rgba(168,85,247,0.15))',
                border: '1px solid rgba(43,128,255,0.15)',
              }}
            >
              <span className="text-4xl opacity-70">{TYPE_EMOJI[type] ?? '📄'}</span>
            </div>
            <p className="text-slate-500 text-xs text-center">O preview aparece aqui quando você<br/>adicionar uma imagem ou legenda</p>
          </div>
        ) : (
          <>
            {/* Post header */}
            <div className="flex items-center gap-2.5 px-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #ec4899, #f97316, #eab308)' }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold leading-tight truncate">{clientName}</p>
                <p className="text-slate-500 text-[11px]">{TYPE_EMOJI[type]} {type}</p>
              </div>
            </div>

            {/* Mídia */}
            {isCarousel && mediaUrls.length > 0 ? (
              <div>
                <div className="w-full bg-black" style={{ aspectRatio: '4/5' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resolveImageUrl(mediaUrls[activeSlide] ?? '')} alt={`Slide ${activeSlide + 1}`}
                    className="w-full h-full object-cover" />
                </div>
                {mediaUrls.length > 1 && (
                  <div className="flex items-center justify-center gap-1.5 py-2">
                    {mediaUrls.map((_, i) => (
                      <button key={i} type="button" onClick={() => setActiveSlide(i)}
                        className={`rounded-full transition-all ${i === activeSlide ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-slate-600 hover:bg-slate-400'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : isReel && imageUrl.trim() ? (
              <div className="w-full bg-black" style={{ position: 'relative', paddingBottom: '177.78%', height: 0, overflow: 'hidden' }}>
                {imageUrl.includes('supabase') || /\.(mp4|mov|webm|m4v)(\?|$)/i.test(imageUrl) ? (
                  <video src={imageUrl} controls playsInline
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <iframe src={getDriveEmbedUrl(imageUrl)} allow="autoplay; fullscreen" allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }} />
                )}
              </div>
            ) : imageUrl.trim() ? (
              <div className="w-full bg-black" style={{ aspectRatio: '4/5' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveImageUrl(imageUrl)} alt="Preview" className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-center gap-2" style={{ aspectRatio: '4/5', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <span className="text-4xl opacity-20">{TYPE_EMOJI[type] ?? '📄'}</span>
                <p className="text-slate-600 text-xs">Nenhuma mídia anexada</p>
              </div>
            )}

            {/* Caption */}
            {caption && (
              <div className="px-3 pt-3 pb-4">
                <p className="text-xs text-white leading-relaxed">
                  <span className="font-semibold">{clientName} </span>
                  <span className="text-slate-300 whitespace-pre-wrap">{caption}</span>
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <p className="text-[11px] text-slate-600 text-center">
        ⚡ Preview atualiza em <span style={{ color: '#2B80FF' }}>tempo real</span>
      </p>
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
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Cenas do Reel
          <span className="ml-2 normal-case text-slate-600 font-normal">
            ({scenes.length} cena{scenes.length !== 1 ? 's' : ''} · ~{scenes.length * 8}s)
          </span>
        </label>
        <button type="button" onClick={add}
          className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full transition-colors hover:text-white"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
          <Plus className="h-3 w-3" /> Cena
        </button>
      </div>
      {scenes.length === 0 && (
        <p className="text-xs text-slate-600 italic">Nenhuma cena. Clique em "+ Cena" para começar.</p>
      )}
      {scenes.map((s, i) => (
        <div key={i} className="rounded-xl p-3 space-y-2"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Cena {s.scene}</span>
            <button type="button" onClick={() => remove(i)} className="text-slate-600 hover:text-red-400 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Prompt visual</label>
            <textarea rows={2} value={s.visual_prompt} onChange={e => update(i, 'visual_prompt', e.target.value)}
              placeholder="Descreva o visual da cena..." className={base + ' resize-none'} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Narração</label>
            <textarea rows={2} value={s.narration} onChange={e => update(i, 'narration', e.target.value)}
              placeholder="Texto falado nesta cena..." className={base + ' resize-none'} />
          </div>
        </div>
      ))}
      {scenes.length > 0 && (
        <button type="button" onClick={add}
          className="w-full rounded-xl py-2 text-xs transition-colors"
          style={{ border: '1px dashed rgba(255,255,255,0.1)', color: '#475569' }}>
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
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Cards do Carrossel
          <span className="ml-2 normal-case text-slate-600 font-normal">
            ({cards.length} slide{cards.length !== 1 ? 's' : ''})
          </span>
        </label>
        <button type="button" onClick={add}
          className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full transition-colors hover:text-white"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
          <Plus className="h-3 w-3" /> Card
        </button>
      </div>
      {cards.length === 0 && (
        <p className="text-xs text-slate-600 italic">Nenhum card adicionado.</p>
      )}
      {cards.map((c, i) => (
        <div key={i} className="rounded-xl p-3 space-y-2"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              {i === 0 ? '🎯 Capa (Card 1)' : `Card ${c.card}`}
            </span>
            <button type="button" onClick={() => remove(i)} className="text-slate-600 hover:text-red-400 transition-colors">
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
          className="w-full rounded-xl py-2 text-xs transition-colors"
          style={{ border: '1px dashed rgba(255,255,255,0.1)', color: '#475569' }}>
          + Adicionar card
        </button>
      )}
    </div>
  )
}

// ── Label helper ──────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
      {children}
    </label>
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

  // Controlled state para preview + contadores
  const [title, setTitle] = useState(content.title ?? '')
  const [caption, setCaption] = useState(content.caption ?? '')
  // Para stories, prioriza media_urls[0] pois o vídeo fica ali (generated_image_url pode estar desatualizado)
  const [imageUrl, setImageUrl] = useState(
    content.type === 'story'
      ? ((content.media_urls ?? [])[0] ?? content.generated_image_url ?? '')
      : (content.generated_image_url ?? '')
  )
  const [mediaUrlsText, setMediaUrlsText] = useState((content.media_urls ?? []).join('\n'))
  const [scheduledTime, setScheduledTime] = useState(content.scheduled_time ?? '09:00')
  const [revisionNotes, setRevisionNotes] = useState(content.revision_notes ?? '')

  // Estado do botão Publicar agora
  const [publishing, setPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const publishNow = async () => {
    if (!confirm('Publicar este conteúdo agora no Facebook e Instagram? Esta ação não pode ser desfeita.')) return
    setPublishing(true)
    setPublishResult(null)
    try {
      const body: Record<string, string> = {}
      if (content.type === 'reel' && imageUrl) body.override_video_url = imageUrl
      if (content.type === 'story' && mediaUrlsText) body.override_media_urls = mediaUrlsText
      if (content.type === 'carrossel' && mediaUrlsText) body.override_media_urls = mediaUrlsText
      if (content.type === 'imagem' && imageUrl) body.override_video_url = imageUrl

      const res = await fetch(`/api/contents/${contentId}/publish-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao publicar')

      const fb = data.facebook
      const ig = data.instagram
      const fbMsg = fb?.post_id ? '✅ Facebook' : `❌ Facebook: ${fb?.error ?? 'erro'}`
      const igMsg = ig?.post_id ? '✅ Instagram' : ig ? `❌ Instagram: ${ig?.error ?? 'erro'}` : ''
      const allOk = !!fb?.post_id && (!ig || !!ig?.post_id)
      setPublishResult({ ok: allOk, msg: [fbMsg, igMsg].filter(Boolean).join(' | ') })
    } catch (e) {
      setPublishResult({ ok: false, msg: e instanceof Error ? e.message : 'Erro ao publicar' })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[5fr_3fr] gap-10 items-start max-w-7xl">

      {/* ── Formulário ── */}
      <form action={update} className="space-y-0">
        <input type="hidden" name="type" value={content.type} />

        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: '#131b2e', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Accent bar */}
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(to right, #2B80FF, #A855F7)' }} />

          <div className="p-5 space-y-5">
            <h2 className="text-sm font-semibold text-white">Conteúdo</h2>

            {/* Título */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <FieldLabel>Título / Tema</FieldLabel>
                <CharCount value={title} max={100} />
              </div>
              <input
                type="text"
                name="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={100}
                className={base}
              />
            </div>

            {/* Story: mídias */}
            {content.type === 'story' ? (
              <div className="space-y-1.5">
                <FieldLabel>Links das mídias (1080×1920) — uma por linha</FieldLabel>
                <textarea
                  name="media_urls_text"
                  rows={3}
                  value={mediaUrlsText}
                  onChange={e => { setMediaUrlsText(e.target.value); setImageUrl(e.target.value.split('\n')[0]?.trim() ?? '') }}
                  placeholder={'https://drive.google.com/file/d/ID1/view\nhttps://drive.google.com/file/d/ID2/view'}
                  className={base + ' resize-none'}
                />
                <input type="hidden" name="generated_image_url" value={imageUrl} />
                <p className="text-xs text-slate-600">Cole um link por linha. O preview mostra o primeiro.</p>
              </div>
            ) : (
              <>
                {/* Caption */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <FieldLabel>Copy / Legenda</FieldLabel>
                    <CharCount value={caption} max={2200} />
                  </div>
                  <textarea
                    name="caption"
                    rows={7}
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    maxLength={2200}
                    className={base + ' resize-none'}
                  />
                </div>

                {/* Roteiro / Estrutura (reel / carrossel) */}
                {(content.type === 'reel' || content.type === 'carrossel') && (
                  <div className="space-y-1.5">
                    <FieldLabel>
                      {content.type === 'carrossel' ? 'Estrutura geral dos slides' : 'Roteiro completo'}
                      <span className="ml-2 normal-case text-slate-600 font-normal">(texto livre)</span>
                    </FieldLabel>
                    <textarea name="script" rows={5} defaultValue={content.script ?? ''} className={base + ' resize-none'} />
                  </div>
                )}

                {content.type === 'reel' && <ScenesEditor initial={content.reel_scenes} />}
                {content.type === 'carrossel' && <CardsEditor initial={content.carousel_cards} />}

                {/* URLs de mídia */}
                {content.type === 'carrossel' ? (
                  <div className="space-y-1.5">
                    <FieldLabel>URLs dos slides (uma por linha)</FieldLabel>
                    <textarea
                      name="media_urls_text"
                      rows={5}
                      value={mediaUrlsText}
                      onChange={e => setMediaUrlsText(e.target.value)}
                      placeholder={'https://drive.google.com/file/d/ID1/view\nhttps://drive.google.com/file/d/ID2/view'}
                      className={base + ' resize-none'}
                    />
                    <p className="text-xs text-slate-600">Cole um link do Google Drive por linha. O preview atualiza na hora.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <FieldLabel>
                      {content.type === 'reel' ? 'Vídeo' : 'URL do criativo (imagem)'}
                    </FieldLabel>
                    {content.type === 'reel' ? (
                      <VideoUploadField clientId={clientId} value={imageUrl} onChange={setImageUrl} />
                    ) : (
                      <>
                        <div className="relative flex items-center">
                          <Link2 className="absolute left-3 h-4 w-4 text-slate-600 pointer-events-none shrink-0" />
                          <input
                            type="url"
                            name="generated_image_url"
                            value={imageUrl}
                            onChange={e => setImageUrl(e.target.value)}
                            placeholder="https://drive.google.com/file/d/.../view"
                            className={base + ' pl-9'}
                          />
                        </div>
                        <p className="text-xs text-slate-600">O preview ao lado atualiza automaticamente ao colar o link.</p>
                      </>
                    )}
                  </div>
                )}

                {/* Prompts toggle */}
                <div>
                  <button type="button" onClick={() => setShowPrompts(v => !v)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    {showPrompts ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {showPrompts ? 'Ocultar campos de prompt' : 'Mostrar campos de prompt (IA)'}
                  </button>
                </div>

                {showPrompts && (
                  <div className="space-y-1.5 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <FieldLabel>Prompt de imagem</FieldLabel>
                    <textarea name="image_prompt" rows={3} defaultValue={content.image_prompt ?? ''}
                      className={base + ' resize-none'} />
                  </div>
                )}

                {/* CTA + Parceiro */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <FieldLabel>CTA</FieldLabel>
                    <input type="text" name="cta" defaultValue={content.cta ?? ''}
                      placeholder="Ex: Agende sua consulta" className={base} />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Parceiro mencionado</FieldLabel>
                    <input type="text" name="partner_mentioned" defaultValue={content.partner_mentioned ?? ''}
                      placeholder="Ex: @parceiro" className={base} />
                  </div>
                </div>
              </>
            )}

            {/* Agendamento */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-widest">
                <CalendarDays className="h-3.5 w-3.5" style={{ color: '#2B80FF' }} />
                Agendamento
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500">Data</label>
                  <input type="date" name="scheduled_date" defaultValue={content.scheduled_date ?? ''} className={base} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500">Hora</label>
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

            {/* Notas de revisão */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <FieldLabel>Notas de revisão</FieldLabel>
                <CharCount value={revisionNotes} max={500} />
              </div>
              <textarea
                name="revision_notes"
                rows={2}
                value={revisionNotes}
                onChange={e => setRevisionNotes(e.target.value)}
                maxLength={500}
                placeholder="Observações para revisão (opcional)"
                className={base + ' resize-none'}
              />
            </div>

            {/* Botões */}
            <div
              className="flex flex-wrap items-center gap-3 pt-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
            >
              <SubmitButton
                className="rounded-full px-6 py-2.5 text-sm font-bold text-white hover:bg-white/5 border border-white/20"
                loadingText="Salvando..."
                savedText="✓ Salvo!"
              >
                Salvar alterações
              </SubmitButton>

              <button
                type="button"
                onClick={publishNow}
                disabled={publishing}
                className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(to right, #2B80FF, #A855F7)' }}
              >
                {publishing
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Publicando...</>
                  : <><Send className="h-4 w-4" /> Publicar agora</>
                }
              </button>
            </div>

            {publishResult && (
              <div
                className="rounded-xl px-4 py-3 text-xs font-medium"
                style={publishResult.ok
                  ? { backgroundColor: 'rgba(6,78,59,0.3)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }
                  : { backgroundColor: 'rgba(127,29,29,0.3)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }
                }
              >
                {publishResult.ok ? '✓ ' : '✗ '}{publishResult.msg}
              </div>
            )}
          </div>
        </div>
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
