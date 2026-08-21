'use client'

import { useState } from 'react'

interface Props {
  urls: string[]
}

export function DownloadAllButton({ urls }: Props) {
  const [downloading, setDownloading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleDownloadAll() {
    setDownloading(true)
    setDone(false)
    for (let i = 0; i < urls.length; i++) {
      const dl = `/api/download?url=${encodeURIComponent(urls[i])}`
      // Cria link temporário e clica
      const a = document.createElement('a')
      a.href = dl
      a.download = `suamidia-slide-${i + 1}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      // Aguarda entre downloads para evitar bloqueio do browser
      if (i < urls.length - 1) await new Promise(r => setTimeout(r, 800))
    }
    setDownloading(false)
    setDone(true)
    setTimeout(() => setDone(false), 3000)
  }

  return (
    <button
      onClick={handleDownloadAll}
      disabled={downloading}
      className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-sm transition-colors disabled:opacity-50"
    >
      {downloading ? (
        <>
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Baixando...
        </>
      ) : done ? (
        <>✓ Slides baixados!</>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Baixar todos os slides ({urls.length})
        </>
      )}
    </button>
  )
}
