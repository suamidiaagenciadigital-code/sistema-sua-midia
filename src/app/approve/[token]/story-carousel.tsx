'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  urls: string[]
  title: string
}

const VIDEO_EXT = /\.(mp4|mov|webm|m4v)(\?|$)/i
const IMAGE_EXT = /\.(png|jpe?g|webp|gif)(\?|$)/i

// "supabase" sozinho não basta mais pra detectar vídeo — imagem também é
// re-hospedada lá agora (ver rehost-video.ts). A extensão no nome do
// arquivo (sempre presente, o rehost preserva o tipo real) decide primeiro;
// "supabase" só entra como fallback pra alguma URL sem extensão reconhecível.
function isVideoUrl(url: string): boolean {
  if (VIDEO_EXT.test(url)) return true
  if (IMAGE_EXT.test(url)) return false
  return url.includes('supabase')
}

// Imagem do Drive: link direto de CDN (funciona em <img src>)
function resolveImageUrl(url: string): string {
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)
  if (driveMatch) return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`
  return url
}

// Vídeo do Drive sem rehost: só o /preview embeda em iframe — um <video src>
// direto não funciona porque a URL do Drive não aponta pro arquivo bruto.
function driveEmbedUrl(url: string): string {
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)
  if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`
  return url
}

// preload="metadata" nem sempre pinta o primeiro frame como capa no Safari
// do iPhone — o vídeo fica com a tela preta até o cliente apertar o play.
// O fragmento #t=0.001 faz o navegador buscar e exibir esse instante como
// capa sem precisar tocar o vídeo nem baixar ele inteiro (preload="auto").
function withPosterFrame(url: string): string {
  return url.includes('#') ? url : `${url}#t=0.001`
}

function StoryFrame({ url, title }: { url: string; title: string }) {
  if (isVideoUrl(url)) {
    return (
      <video
        src={withPosterFrame(url)}
        controls
        playsInline
        preload="metadata"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
      />
    )
  }
  // Link cru do Drive sem extensão no nome — não dá pra saber se é vídeo
  // sem baixar o arquivo, então usa o preview embutido do Drive, que
  // reproduz tanto imagem quanto vídeo corretamente.
  if (/drive\.google\.com\/file\/d\//.test(url) && !isVideoUrl(url)) {
    return (
      <img
        src={resolveImageUrl(url)}
        alt={title}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => {
          // Fallback: se a CDN de imagem falhar (era vídeo, ou arquivo não é imagem),
          // troca para o preview embutido do Drive, que funciona para qualquer tipo.
          const img = e.currentTarget
          const parent = img.parentElement
          if (parent && !parent.querySelector('iframe')) {
            img.style.display = 'none'
            const iframe = document.createElement('iframe')
            iframe.src = driveEmbedUrl(url)
            iframe.allow = 'fullscreen'
            iframe.allowFullscreen = true
            Object.assign(iframe.style, { position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', border: '0' })
            parent.appendChild(iframe)
          }
        }}
      />
    )
  }
  return (
    <img
      src={resolveImageUrl(url)}
      alt={title}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
    />
  )
}

export function StoryCarousel({ urls, title }: Props) {
  const [current, setCurrent] = useState(0)
  const total = urls.length

  return (
    <div
      className="relative w-full bg-black select-none"
      style={{ position: 'relative', paddingBottom: '177.78%', height: 0, overflow: 'hidden' }}
    >
      <StoryFrame url={urls[current]} title={title} />

      {total > 1 && (
        <>
          <button
            onClick={() => setCurrent((i) => Math.max(0, i - 1))}
            disabled={current === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white disabled:opacity-20 hover:bg-black/70 transition-colors z-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrent((i) => Math.min(total - 1, i + 1))}
            disabled={current === total - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white disabled:opacity-20 hover:bg-black/70 transition-colors z-10"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Barras estilo story do Instagram, uma por frame */}
          <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
            {urls.map((_, i) => (
              <div key={i} className="h-0.5 flex-1 rounded-full bg-white/30 overflow-hidden">
                <div className={`h-full bg-white ${i <= current ? 'w-full' : 'w-0'}`} />
              </div>
            ))}
          </div>

          <div className="absolute top-4 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full z-10">
            {current + 1}/{total}
          </div>
        </>
      )}
    </div>
  )
}
