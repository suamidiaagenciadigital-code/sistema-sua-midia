'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, Sparkles, Save, RefreshCw, Plus, Trash2,
  PenLine, ChevronDown, ChevronUp, FileUp, AlertCircle, CalendarDays, Loader2, Upload,
  Play, LayoutGrid, Image as ImageIcon, Zap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useDriveRehost } from '@/lib/use-drive-rehost'
import { Link2 } from 'lucide-react'

// ── Lumina input class ────────────────────────────────────────
const base = "w-full rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none transition-colors bg-white/5 border border-white/10"

// ── Upload direto do browser para Supabase via URL assinada ──────────────
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
        body: JSON.stringify({ clientId, file_url: publicUrl, file_type: 'video', original_name: file.name, size_bytes: file.size, tags: ['reel'] }),
      })
      onChange(publicUrl)
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Erro no upload')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const isRehosting = rehostState === 'loading'

  return (
    <div className="space-y-2">
      <div className="relative flex items-center">
        <Link2 className="absolute left-3 h-4 w-4 text-slate-600 pointer-events-none shrink-0" />
        {isRehosting && <Loader2 className="absolute right-3 h-4 w-4 text-blue-400 animate-spin pointer-events-none" />}
        <input
          type="url"
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={e => { if (isDriveUrl(e.target.value)) rehost(e.target.value, onChange) }}
          onPaste={e => {
            const pasted = e.clipboardData.getData('text')
            if (/drive\.google\.com/.test(pasted)) setTimeout(() => rehost(pasted, onChange), 100)
          }}
          placeholder="Cole o link do Drive ou Supabase"
          className={base + ' flex-1 pl-9 pr-9'}
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
      {rehostError && <p className="text-xs text-red-400">Rehost: {rehostError}</p>}
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
      {value && value.includes('supabase') && rehostState === 'idle' && (
        <p className="text-xs text-emerald-400">✓ Vídeo hospedado no Supabase — pronto para Instagram</p>
      )}
    </div>
  )
}

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
  {
    value: 'reel', label: 'Reel', desc: 'Vídeo vertical ~30-60s',
    iconBg: 'linear-gradient(135deg, rgba(29,78,216,0.6), rgba(43,128,255,0.6))',
    iconBorder: 'rgba(43,128,255,0.4)',
    Icon: Play,
  },
  {
    value: 'carrossel', label: 'Carrossel', desc: '3-5 slides educativos',
    iconBg: 'linear-gradient(135deg, rgba(124,58,237,0.6), rgba(219,39,119,0.6))',
    iconBorder: 'rgba(168,85,247,0.4)',
    Icon: LayoutGrid,
  },
  {
    value: 'imagem', label: 'Imagem', desc: 'Post de feed',
    iconBg: 'linear-gradient(135deg, rgba(13,148,136,0.6), rgba(5,150,105,0.6))',
    iconBorder: 'rgba(52,211,153,0.4)',
    Icon: ImageIcon,
  },
  {
    value: 'story', label: 'Story', desc: 'Conteúdo efêmero',
    iconBg: 'linear-gradient(135deg, rgba(217,119,6,0.6), rgba(234,88,12,0.6))',
    iconBorder: 'rgba(251,146,60,0.4)',
    Icon: Zap,
  },
]

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
  title,
  creativeUrl,
  mediaUrlsText,
}: {
  clientName: string
  type: string
  caption: string
  title: string
  creativeUrl: string
  mediaUrlsText: string
}) {
  const initials = clientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const hasContent = caption.trim() || creativeUrl.trim() || title.trim()

  const isReel = type === 'reel'
  const isCarousel = type === 'carrossel'
  const isStory = type === 'story'
  const mediaUrls = isCarousel
    ? mediaUrlsText.split('\n').map(u => u.trim()).filter(Boolean)
    : []

  const [activeSlide, setActiveSlide] = useState(0)

  return (
    <div className="sticky top-6 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>Preview</p>

      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: '#131b2e', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {!hasContent ? (
          <div
            className="flex flex-col items-center justify-center gap-3 py-14 px-6"
          >
            {/* Icon placeholder */}
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(43,128,255,0.15), rgba(168,85,247,0.15))',
                border: '1px solid rgba(43,128,255,0.2)',
              }}
            >
              <span className="text-5xl opacity-70">{TYPE_EMOJI[type] ?? '📄'}</span>
            </div>
            <p className="text-slate-400 text-sm text-center leading-relaxed">
              Preencha os campos<br />ao lado para ver o preview
            </p>
          </div>
        ) : isStory ? (
          creativeUrl.trim() ? (
            <div className="w-full bg-black" style={{ aspectRatio: '9/16' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImageUrl(creativeUrl)}
                alt="Story preview"
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center gap-2" style={{ aspectRatio: '9/16', backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <span className="text-4xl opacity-20">📲</span>
              <p className="text-slate-600 text-xs">1080 × 1920</p>
            </div>
          )
        ) : (
          <>
            {/* Post header */}
            <div className="flex items-center gap-2.5 px-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #ec4899, #f97316, #eab308)' }}>
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
                        onClick={() => setActiveSlide(i)}
                        className={`rounded-full transition-all ${i === activeSlide ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-slate-600 hover:bg-slate-400'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : isReel && creativeUrl.trim() ? (
              <div className="w-full bg-black" style={{ position: 'relative', paddingBottom: '177.78%', height: 0, overflow: 'hidden' }}>
                {creativeUrl.includes('supabase') || /\.(mp4|mov|webm|m4v)(\?|$)/i.test(creativeUrl) ? (
                  <video
                    src={creativeUrl}
                    controls
                    playsInline
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <iframe
                    src={getDriveEmbedUrl(creativeUrl)}
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                  />
                )}
              </div>
            ) : creativeUrl.trim() ? (
              <div className="w-full bg-black" style={{ aspectRatio: '4/5' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveImageUrl(creativeUrl)}
                  alt={title || 'Preview'}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-center gap-2" style={{ aspectRatio: '4/5', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <span className="text-4xl opacity-20">{TYPE_EMOJI[type] ?? '📄'}</span>
                <p className="text-slate-600 text-xs">Nenhuma mídia anexada</p>
              </div>
            )}

            {/* Caption */}
            {(caption || title) && (
              <div className="px-3 pt-3 pb-4 space-y-1">
                {caption ? (
                  <p className="text-xs text-white leading-relaxed">
                    <span className="font-semibold">{clientName} </span>
                    <span className="text-slate-300 whitespace-pre-wrap">{caption}</span>
                  </p>
                ) : title ? (
                  <p className="text-xs text-slate-400 italic">{title}</p>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>

      <p className="text-[11px] text-slate-600 text-center">
        Preview atualiza em <span style={{ color: '#2B80FF' }}>tempo real</span>
      </p>
    </div>
  )
}

// ── Scenes / Cards editors ────────────────────────────────────

function ScenesEditor({ scenes, setScenes }: { scenes: ReelScene[]; setScenes: (s: ReelScene[]) => void }) {
  const add = () => setScenes([...scenes, { scene: scenes.length + 1, visual_prompt: '', narration: '' }])
  const remove = (i: number) =>
    setScenes(scenes.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, scene: idx + 1 })))
  const update = (i: number, key: keyof ReelScene, val: string) =>
    setScenes(scenes.map((s, idx) => idx === i ? { ...s, [key]: val } : s))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Cenas do Reel
          <span className="ml-2 normal-case text-slate-600 font-normal">
            ({scenes.length} cena{scenes.length !== 1 ? 's' : ''} · ~{scenes.length * 8}s)
          </span>
        </label>
        <button type="button" onClick={add}
          className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
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
              placeholder="Descreva o visual da cena para geração de imagem/vídeo"
              className={base + ' resize-none'} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Narração</label>
            <textarea rows={2} value={s.narration} onChange={e => update(i, 'narration', e.target.value)}
              placeholder="Texto falado nesta cena"
              className={base + ' resize-none'} />
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

function CardsEditor({ cards, setCards }: { cards: CarouselCard[]; setCards: (c: CarouselCard[]) => void }) {
  const add = () => setCards([...cards, { card: cards.length + 1, hook: '', image_prompt: '', caption: '' }])
  const remove = (i: number) =>
    setCards(cards.filter((_, idx) => idx !== i).map((c, idx) => ({ ...c, card: idx + 1 })))
  const update = (i: number, key: keyof CarouselCard, val: string) =>
    setCards(cards.map((c, idx) => idx === i ? { ...c, [key]: val } : c))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Cards do Carrossel
          <span className="ml-2 normal-case text-slate-600 font-normal">
            ({cards.length} slide{cards.length !== 1 ? 's' : ''})
          </span>
        </label>
        <button type="button" onClick={add}
          className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
          <Plus className="h-3 w-3" /> Card
        </button>
      </div>
      {cards.length === 0 && (
        <p className="text-xs text-slate-600 italic">Nenhum card. Clique em "+ Card" para começar.</p>
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
          className="w-full rounded-xl py-2 text-xs transition-colors"
          style={{ border: '1px dashed rgba(255,255,255,0.1)', color: '#475569' }}>
          + Adicionar card
        </button>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────

export default function ContentGenerator({ clientId, clientName }: { clientId: string; clientName: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<'ai' | 'manual'>('ai')
  const [type, setType] = useState('reel')
  const [theme, setTheme] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [edited, setEdited] = useState<Generated | null>(null)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('09:00')
  const [creativeUrl, setCreativeUrl] = useState('')
  const [mediaUrlsText, setMediaUrlsText] = useState('')
  const [scenes, setScenes] = useState<ReelScene[]>([])
  const [cards, setCards] = useState<CarouselCard[]>([])
  const [showPrompts, setShowPrompts] = useState(false)
  const [importError, setImportError] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  const initManual = () => {
    setEdited({ title: '', caption: '', script: null, image_prompt: '', cta: '', partner_mentioned: null })
    setScenes([])
    setCards([])
    setCreativeUrl('')
    setMediaUrlsText('')
    setSaved(false)
    setError('')
  }

  const switchMode = (m: 'ai' | 'manual') => {
    setMode(m)
    setImportError('')
    if (m === 'manual') initManual()
    else { setEdited(null); setCreativeUrl(''); setMediaUrlsText('') }
  }

  const importFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError('')
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const item = Array.isArray(data.contents) ? data.contents[0] : data

      if (!item?.title) {
        setImportError('JSON inválido. O arquivo deve ter um campo "title".')
        return
      }

      const validTypes = ['imagem', 'reel', 'story', 'carrossel']
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
      if (item.generated_image_url) setCreativeUrl(item.generated_image_url)
      if (item.media_urls?.length) setMediaUrlsText(item.media_urls.join('\n'))
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
    if (!edited.title?.trim()) {
      setError('Preencha o título antes de salvar.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const mediaUrls = (type === 'carrossel' || type === 'story')
        ? mediaUrlsText.split('\n').map(u => u.trim()).filter(Boolean)
        : null

      const payload = {
        client_id: clientId,
        type,
        scheduled_date: scheduledDate || null,
        scheduled_time: scheduledDate ? scheduledTime : null,
        status: 'sent_to_client',
        ...edited,
        generated_image_url: type !== 'carrossel' && creativeUrl.trim() ? creativeUrl.trim() : null,
        media_urls: mediaUrls && mediaUrls.length > 0 ? mediaUrls : null,
        reel_scenes: type === 'reel' && scenes.length > 0 ? scenes : null,
        carousel_cards: type === 'carrossel' && cards.length > 0 ? cards : null,
      }
      const res = await fetch('/api/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erro ao salvar')
      }
      setSaved(true)
      setTimeout(() => {
        router.push(`/clients/${clientId}/calendar`)
      }, 1500)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar conteúdo.')
    } finally {
      setSaving(false)
    }
  }

  const setField = (key: keyof Generated, val: string) =>
    setEdited(prev => prev ? { ...prev, [key]: val } : prev)

  const inputField = (label: string, key: keyof Generated, placeholder = '') => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label}</label>
      <input type="text" value={(edited?.[key] as string) ?? ''} onChange={e => setField(key, e.target.value)}
        placeholder={placeholder} className={base} />
    </div>
  )

  const textareaField = (label: string, key: keyof Generated, rows = 3, placeholder = '') => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label}</label>
      <textarea rows={rows} value={(edited?.[key] as string) ?? ''} onChange={e => setField(key, e.target.value)}
        placeholder={placeholder} className={base + ' resize-none'} />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/clients/${clientId}/calendar`}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <ChevronLeft className="h-4 w-4 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-white">Novo conteúdo</h1>
            <p className="text-slate-500 text-sm mt-0.5">{clientName}</p>
          </div>
        </div>
        <Link
          href={`/clients/${clientId}/calendar`}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <CalendarDays className="h-4 w-4" />
          Ver calendário
        </Link>
      </div>

      {/* Layout: form + preview */}
      <div className="grid grid-cols-1 xl:grid-cols-[5fr_3fr] gap-10 items-start max-w-7xl">

        {/* ── Coluna esquerda: formulário ── */}
        <div className="space-y-5">

          {/* Modo: IA ou Manual */}
          <div
            className="flex gap-1 rounded-xl p-1"
            style={{ backgroundColor: '#131b2e', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <button
              type="button"
              onClick={() => switchMode('ai')}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all"
              style={mode === 'ai'
                ? { background: 'linear-gradient(to right, #2B80FF, #A855F7)', color: '#fff' }
                : { color: '#64748b' }
              }
            >
              <Sparkles className="h-4 w-4" /> Gerar com IA
            </button>
            <button
              type="button"
              onClick={() => switchMode('manual')}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all"
              style={mode === 'manual'
                ? { background: 'linear-gradient(to right, #2B80FF, #A855F7)', color: '#fff' }
                : { color: '#64748b' }
              }
            >
              <PenLine className="h-4 w-4" /> Criar manualmente
            </button>
          </div>

          {/* Tipo de conteúdo */}
          <div
            className="rounded-xl p-5 space-y-5"
            style={{ backgroundColor: '#131b2e', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Tipo de conteúdo</label>
              <div className="grid grid-cols-4 gap-3">
                {contentTypes.map(({ value, label, desc, iconBg, iconBorder, Icon }) => {
                  const isSelected = type === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setType(value)
                        setScenes([])
                        setCards([])
                        setCreativeUrl('')
                        setMediaUrlsText('')
                      }}
                      className="relative rounded-xl p-4 text-left transition-all"
                      style={{
                        backgroundColor: isSelected ? 'rgba(43,128,255,0.06)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '1.5px solid #2B80FF' : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: isSelected ? '0 0 20px rgba(43,128,255,0.12)' : undefined,
                      }}
                    >
                      {/* Checkmark */}
                      {isSelected && (
                        <div
                          className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #2B80FF, #A855F7)' }}
                        >
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                      {/* Icon badge */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                        style={{ background: iconBg, border: `1px solid ${iconBorder}` }}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-sm font-semibold text-white">{label}</div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-snug">{desc}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Controles modo IA */}
            {mode === 'ai' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    Tema / gancho <span className="normal-case text-slate-600 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={theme}
                    onChange={e => setTheme(e.target.value)}
                    placeholder="Ex: Dia do noivo, barba perfeita, experiência premium..."
                    className={base}
                  />
                </div>
                <button
                  onClick={generate}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(to right, #2B80FF, #A855F7)' }}
                >
                  {loading
                    ? <><RefreshCw className="h-4 w-4 animate-spin" /> Gerando...</>
                    : <><Sparkles className="h-4 w-4" /> Gerar com IA</>
                  }
                </button>
              </>
            )}

            {/* Controles modo manual */}
            {mode === 'manual' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">Preencha os campos abaixo ou importe um JSON gerado no chat do Claude.</p>
                <input ref={importRef} type="file" accept=".json" onChange={importFromFile} className="hidden" />
                <button
                  type="button"
                  onClick={() => importRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-slate-300 hover:text-white transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' }}
                >
                  <FileUp className="h-4 w-4" /> Importar conteúdo (.json)
                </button>
                {importError && (
                  <div className="flex items-center gap-1.5 text-xs text-red-400">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />{importError}
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          {/* Formulário de edição */}
          {edited !== null && (
            <div
              className="rounded-xl p-5 space-y-5"
              style={{ backgroundColor: '#131b2e', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Accent bar top */}
              <div className="-mx-5 -mt-5 h-0.5 mb-5 rounded-t-xl" style={{ background: 'linear-gradient(to right, #2B80FF, #A855F7)' }} />

              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">
                  {mode === 'ai' ? 'Conteúdo gerado — edite antes de salvar' : 'Preencha o conteúdo'}
                </h2>
                {mode === 'ai' && (
                  <button
                    onClick={generate}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Regenerar
                  </button>
                )}
              </div>

              {inputField('Título / Tema *', 'title',
                type === 'story' ? 'Ex: Story — promoção de quinta' : 'Ex: Barba do mês — o look mais pedido'
              )}

              {/* Story: múltiplas mídias */}
              {type === 'story' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    Links das mídias (1080×1920) — uma por linha
                  </label>
                  <textarea
                    rows={3}
                    value={mediaUrlsText}
                    onChange={e => { setMediaUrlsText(e.target.value); setCreativeUrl(e.target.value.split('\n')[0]?.trim() ?? '') }}
                    placeholder={'https://drive.google.com/file/d/ID1/view\nhttps://drive.google.com/file/d/ID2/view'}
                    className={base + ' resize-none'}
                  />
                  <p className="text-xs text-slate-600">Cole um link por linha. O preview mostra o primeiro.</p>
                </div>
              ) : (
                <>
                  {textareaField('Copy / Legenda', 'caption', 6, 'Legenda completa com emojis e hashtags')}

                  {(type === 'reel' || type === 'carrossel') && (
                    textareaField(
                      type === 'carrossel' ? 'Estrutura geral dos slides' : 'Roteiro completo',
                      'script', 5,
                      type === 'carrossel' ? 'Descreva a sequência dos slides...' : 'Descreva o roteiro do vídeo...'
                    )
                  )}

                  {type === 'reel' && <ScenesEditor scenes={scenes} setScenes={setScenes} />}
                  {type === 'carrossel' && <CardsEditor cards={cards} setCards={setCards} />}

                  {/* URL do criativo */}
                  {type === 'carrossel' ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                        URLs dos slides (uma por linha)
                      </label>
                      <textarea
                        rows={4}
                        value={mediaUrlsText}
                        onChange={e => setMediaUrlsText(e.target.value)}
                        placeholder={'https://drive.google.com/file/d/ID1/view\nhttps://drive.google.com/file/d/ID2/view'}
                        className={base + ' resize-none'}
                      />
                      <p className="text-xs text-slate-600">Cole um link do Google Drive por linha. O preview atualiza automaticamente.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                        {type === 'reel' ? 'Vídeo' : 'URL do criativo (imagem)'}
                      </label>
                      {type === 'reel' ? (
                        <VideoUploadField clientId={clientId} value={creativeUrl} onChange={setCreativeUrl} />
                      ) : (
                        <>
                          <input
                            type="url"
                            value={creativeUrl}
                            onChange={e => setCreativeUrl(e.target.value)}
                            placeholder="https://drive.google.com/file/d/.../view"
                            className={base}
                          />
                          <p className="text-xs text-slate-600">
                            Link da imagem no Google Drive ou URL pública. O preview atualiza na hora.
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Prompts toggle */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowPrompts(v => !v)}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPrompts ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {showPrompts ? 'Ocultar campos de prompt' : 'Mostrar campos de prompt (IA)'}
                    </button>
                  </div>

                  {showPrompts && (
                    <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      {textareaField('Prompt de imagem', 'image_prompt', 3, 'Descreva o visual para Midjourney/DALL-E')}
                    </div>
                  )}

                  {inputField('CTA', 'cta', 'Ex: Agende pelo link na bio')}
                  {inputField('Parceiro mencionado', 'partner_mentioned', 'Ex: @parceiro')}
                </>
              )}

              {/* Agendamento */}
              <div
                className="rounded-xl p-4 space-y-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Agendamento
                  <span className="normal-case font-normal text-slate-600 ml-1">(deixe em branco para salvar sem data)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500">Data</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                      className={base}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500">Hora</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={e => setScheduledTime(e.target.value)}
                      className={base}
                    />
                  </div>
                </div>
                {!scheduledDate && (
                  <p className="text-xs" style={{ color: '#d97706' }}>
                    ⚠ Sem data, o conteúdo aparece em "Rascunhos sem data" no calendário.
                  </p>
                )}
              </div>

              {/* Salvar */}
              <div
                className="flex flex-wrap items-center gap-3 pt-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
              >
                <button
                  onClick={save}
                  disabled={saving || saved}
                  className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-60 ${
                    saved ? '' : 'hover:opacity-90'
                  }`}
                  style={{
                    background: saved
                      ? 'linear-gradient(to right, #059669, #10b981)'
                      : 'linear-gradient(to right, #2B80FF, #A855F7)',
                  }}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saved ? '✓ Salvo! Redirecionando...' : saving ? 'Salvando...' : 'Salvar conteúdo'}
                </button>
                <p className="text-xs text-slate-600">Para publicar, salve e use o botão na página do conteúdo.</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Coluna direita: preview ── */}
        <PreviewPanel
          clientName={clientName}
          type={type}
          caption={edited?.caption ?? ''}
          title={edited?.title ?? ''}
          creativeUrl={creativeUrl}
          mediaUrlsText={mediaUrlsText}
        />
      </div>
    </div>
  )
}
