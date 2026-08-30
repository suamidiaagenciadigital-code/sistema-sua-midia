'use client'

import { useState } from 'react'

const TYPE_LABEL: Record<string, string> = {
  imagem: 'Imagem',
  reel: 'Reel',
  carrossel: 'Carrossel',
  story: 'Story',
}

const TYPE_EMOJI: Record<string, string> = {
  imagem: '📷',
  reel: '🎬',
  carrossel: '🗂️',
  story: '📲',
}

function resolveImageUrl(url: string | null): string | null {
  if (!url) return null
  const m = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)
  if (m) return `https://lh3.googleusercontent.com/d/${m[1]}`
  return url
}

function getDownloadUrl(url: string | null): string | null {
  if (!url) return null
  const m = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)
  if (m) return `https://drive.google.com/uc?export=download&id=${m[1]}`
  return url
}

function getDriveEmbedUrl(url: string): string | null {
  const m = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`
  return null
}

function isDriveUrl(url: string): boolean {
  return /drive\.google\.com/.test(url)
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url)
}

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

type Content = {
  id: string
  title: string | null
  type: string
  caption: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  status: string
  generated_image_url: string | null
  media_urls: string[] | null
}

function ContentCard({ c }: { c: Content }) {
  const [slide, setSlide] = useState(0)
  const isStory = c.type === 'story'
  const isReel = c.type === 'reel'
  const isCarousel = c.type === 'carrossel'
  const mediaUrls: string[] = isCarousel || isStory
    ? (c.media_urls ?? (c.generated_image_url ? [c.generated_image_url] : []))
    : (c.generated_image_url ? [c.generated_image_url] : [])

  const currentUrl = mediaUrls[slide] ?? null
  const allDownloadUrls = mediaUrls.map(getDownloadUrl).filter(Boolean) as string[]

  return (
    <div className="bg-[#131b2e] rounded-2xl overflow-hidden border border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{TYPE_EMOJI[c.type] ?? '📄'}</span>
          <div>
            <p className="text-white text-sm font-medium">{c.title || TYPE_LABEL[c.type] || c.type}</p>
            {c.scheduled_date && (
              <p className="text-slate-500 text-xs">{formatDate(c.scheduled_date)}</p>
            )}
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          c.status === 'published'
            ? 'bg-green-950/50 text-green-400 border border-green-800/50'
            : 'bg-blue-950/50 text-blue-400 border border-blue-800/50'
        }`}>
          {c.status === 'published' ? '✓ Publicado' : '✓ Aprovado'}
        </span>
      </div>

      {/* Mídia */}
      {currentUrl ? (
        <div
          className="w-full bg-black relative overflow-hidden"
          style={{ aspectRatio: isStory ? '9/16' : isReel ? '9/16' : '4/5' }}
        >
          {isReel || (isStory && (isVideoUrl(currentUrl) || isDriveUrl(currentUrl))) ? (
            isDriveUrl(currentUrl!) ? (
              <iframe
                src={getDriveEmbedUrl(currentUrl!)!}
                allow="autoplay; fullscreen"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              <video
                key={currentUrl}
                src={currentUrl}
                controls
                playsInline
                preload="metadata"
                className="w-full h-full object-contain"
              />
            )
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveImageUrl(currentUrl)!}
              alt={c.title ?? ''}
              className="w-full h-full object-cover"
            />
          )}

          {/* Navegação de slides (carrossel e story com múltiplas mídias) */}
          {mediaUrls.length > 1 && (
            <>
              <button
                onClick={() => setSlide(s => Math.max(0, s - 1))}
                disabled={slide === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center disabled:opacity-30 hover:bg-black/80 transition-colors"
              >‹</button>
              <button
                onClick={() => setSlide(s => Math.min(mediaUrls.length - 1, s + 1))}
                disabled={slide === mediaUrls.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center disabled:opacity-30 hover:bg-black/80 transition-colors"
              >›</button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {mediaUrls.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    className={`rounded-full transition-all ${i === slide ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="w-full bg-slate-900 flex items-center justify-center" style={{ aspectRatio: '4/5' }}>
          <span className="text-slate-600 text-sm">Sem mídia</span>
        </div>
      )}

      {/* Legenda */}
      {c.caption && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-slate-300 text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap">{c.caption}</p>
        </div>
      )}

      {/* Botões de download */}
      {allDownloadUrls.length > 0 && (
        <div className="px-4 py-3 flex flex-wrap gap-2">
          {allDownloadUrls.length === 1 ? (
            <a
              href={allDownloadUrls[0]}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-sm transition-colors"
            >
              ↓ Baixar {isReel ? 'vídeo' : isStory ? 'story' : 'imagem'}
            </a>
          ) : (
            allDownloadUrls.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-xs transition-colors"
              >
                ↓ {isStory ? `Frame ${i + 1}` : `Slide ${i + 1}`}
              </a>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function PortalPublicacoes({ contents }: { contents: Content[] }) {
  const [filter, setFilter] = useState<string>('todos')

  const types = ['todos', ...Array.from(new Set(contents.map(c => c.type)))]

  const filtered = filter === 'todos' ? contents : contents.filter(c => c.type === filter)

  if (contents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <span className="text-4xl">📭</span>
        <p className="text-white font-medium">Nenhuma publicação ainda</p>
        <p className="text-slate-500 text-sm">As publicações aprovadas aparecerão aqui.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Filtro por tipo */}
      <div className="flex gap-2 flex-wrap mb-6">
        {types.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              filter === t
                ? 'text-white border-blue-500 bg-blue-500/20'
                : 'text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'
            }`}
          >
            {t === 'todos' ? 'Todos' : (TYPE_EMOJI[t] ?? '') + ' ' + (TYPE_LABEL[t] ?? t)}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <ContentCard key={c.id} c={c} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-12">
          Nenhuma publicação do tipo selecionado.
        </p>
      )}
    </div>
  )
}
