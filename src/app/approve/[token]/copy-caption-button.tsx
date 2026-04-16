'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyCaptionButton({ caption }: { caption: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(caption)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback para dispositivos sem clipboard API
      const el = document.createElement('textarea')
      el.value = caption
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
        copied
          ? 'border-green-700 text-green-400 bg-green-950/30'
          : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
      }`}
    >
      {copied ? (
        <><Check className="h-3.5 w-3.5" /> Copiado!</>
      ) : (
        <><Copy className="h-3.5 w-3.5" /> Copiar legenda</>
      )}
    </button>
  )
}
