'use client'

import { useState } from 'react'

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
)

// Extensão vem do tipo real do arquivo, não do nome de origem
function extFromType(type: string): string {
  if (type.includes('mp4')) return 'mp4'
  if (type.includes('quicktime') || type.includes('mov')) return 'mov'
  if (type.includes('webm')) return 'webm'
  if (type.includes('m4v')) return 'm4v'
  if (type.includes('png')) return 'png'
  if (type.includes('webp')) return 'webp'
  if (type.includes('gif')) return 'gif'
  if (type.startsWith('video/')) return 'mp4'
  return 'jpg'
}

async function downloadBlob(url: string, baseName: string) {
  const resp = await fetch(`/api/download?url=${encodeURIComponent(url)}`, { credentials: 'include' })
  if (!resp.ok) throw new Error('Falha ao baixar')

  // Extensão vem do servidor (tipo real do arquivo); o nome mantém a numeração local
  const disposition = resp.headers.get('content-disposition') ?? ''
  const serverExt = disposition.match(/filename="?[^";]*\.([a-z0-9]+)"?/i)?.[1]
  const blob = await resp.blob()
  const filename = `${baseName}.${serverExt ?? extFromType(blob.type)}`

  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
}

interface SingleProps {
  url: string
  label?: string
}

export function DownloadButton({ url, label }: SingleProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')

  async function handle() {
    setState('loading')
    try {
      await downloadBlob(url, `suamidia-${Date.now()}`)
      setState('done')
      setTimeout(() => setState('idle'), 3000)
    } catch {
      setState('idle')
    }
  }

  return (
    <button
      onClick={handle}
      disabled={state === 'loading'}
      className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-sm transition-colors disabled:opacity-50"
    >
      {state === 'loading' ? (
        <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Baixando...</>
      ) : state === 'done' ? (
        <>✓ Baixado!</>
      ) : (
        <><DownloadIcon />{label ?? 'Baixar arquivo'}</>
      )}
    </button>
  )
}

interface AllProps {
  urls: string[]
}

export function DownloadAllButton({ urls }: AllProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')

  async function handle() {
    setState('loading')
    for (let i = 0; i < urls.length; i++) {
      try {
        await downloadBlob(urls[i], `suamidia-slide-${i + 1}`)
      } catch { /* continua mesmo se um falhar */ }
      if (i < urls.length - 1) await new Promise(r => setTimeout(r, 800))
    }
    setState('done')
    setTimeout(() => setState('idle'), 3000)
  }

  return (
    <button
      onClick={handle}
      disabled={state === 'loading'}
      className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-sm transition-colors disabled:opacity-50"
    >
      {state === 'loading' ? (
        <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Baixando...</>
      ) : state === 'done' ? (
        <>✓ Slides baixados!</>
      ) : (
        <><DownloadIcon />Baixar todos os slides ({urls.length})</>
      )}
    </button>
  )
}
