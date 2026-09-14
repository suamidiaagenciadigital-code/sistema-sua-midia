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

async function fetchAsFile(url: string, baseName: string): Promise<File> {
  const resp = await fetch(`/api/download?url=${encodeURIComponent(url)}`, { credentials: 'include' })
  if (!resp.ok) throw new Error('Falha ao baixar')

  // Extensão vem do servidor (tipo real do arquivo); o nome mantém a numeração local
  const disposition = resp.headers.get('content-disposition') ?? ''
  const serverExt = disposition.match(/filename="?[^";]*\.([a-z0-9]+)"?/i)?.[1]
  const blob = await resp.blob()
  const filename = `${baseName}.${serverExt ?? extFromType(blob.type)}`

  return new File([blob], filename, { type: blob.type })
}

function triggerAnchorDownload(file: File) {
  const blobUrl = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
}

// No Safari do iPhone, <a download> sempre cai em "Salvar em Arquivos" — nunca
// oferece salvar direto na galeria de Fotos. O Web Share API, quando o
// navegador suporta compartilhar o arquivo de verdade, faz o próprio iOS
// mostrar "Guardar Imagem/Vídeo" na folha de compartilhamento nativa. Onde
// não tem suporte (a maioria dos desktops), cai no download tradicional —
// comportamento inalterado.
async function shareOrDownload(files: File[]) {
  let canShare = false
  try {
    canShare = typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare?.({ files })
  } catch {
    canShare = false
  }

  if (canShare) {
    try {
      await navigator.share({ files })
      return
    } catch (e: any) {
      if (e?.name === 'AbortError') return // usuário cancelou a folha de compartilhamento — não é erro
      // qualquer outro erro no share cai pro download tradicional abaixo
    }
  }

  files.forEach(triggerAnchorDownload)
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
      const file = await fetchAsFile(url, `suamidia-${Date.now()}`)
      await shareOrDownload([file])
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

interface EachProps {
  urls: string[]
  labelPrefix?: string
}

// Um botão por slide/frame, cada um reaproveitando o DownloadButton (Web
// Share quando suportado, senão download tradicional) — evita disparar
// vários downloads em sequência de uma vez só, que no Safari do iPhone
// gerava uma folha "Salvar em..." atrás da outra.
export function DownloadEachButton({ urls, labelPrefix = 'Baixar slide' }: EachProps) {
  return (
    <div className="space-y-2 w-full">
      {urls.map((url, i) => (
        <DownloadButton key={url} url={url} label={`${labelPrefix} ${i + 1}`} />
      ))}
    </div>
  )
}

