'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  urls: string[]
}

function resolveUrl(url: string): string {
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)
  if (driveMatch) return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`
  return url
}

export function MediaCarousel({ urls }: Props) {
  const [current, setCurrent] = useState(0)
  const total = urls.length

  return (
    <div className="relative w-full aspect-square bg-zinc-900 select-none">
      {/* Imagem atual */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolveUrl(urls[current])}
        alt={`Slide ${current + 1}`}
        className="w-full h-full object-cover"
      />

      {/* Navegação */}
      {total > 1 && (
        <>
          <button
            onClick={() => setCurrent(i => Math.max(0, i - 1))}
            disabled={current === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white disabled:opacity-20 hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrent(i => Math.min(total - 1, i + 1))}
            disabled={current === total - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white disabled:opacity-20 hover:bg-black/70 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {urls.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>

          {/* Contador */}
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
            {current + 1}/{total}
          </div>
        </>
      )}
    </div>
  )
}
