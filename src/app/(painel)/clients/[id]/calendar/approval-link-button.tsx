'use client'

import { useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'

// "Aprovação": abre a página do cliente (com o link curto na barra) e, ao lado,
// copia o link curto para colar no WhatsApp. O link com UUID não serve para
// WhatsApp: ele o lê como chave Pix e o link quebra.
export function ApprovalLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const box = { border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)' }

  return (
    <div className="flex items-stretch rounded-lg overflow-hidden" style={box}>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Aprovação
      </a>
      <button
        type="button"
        onClick={copy}
        title="Copiar link de aprovação (para o WhatsApp)"
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
        style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}
      >
        {copied ? <><Check className="h-3.5 w-3.5 text-green-400" /> Copiado</> : <><Copy className="h-3.5 w-3.5" /> Copiar link</>}
      </button>
    </div>
  )
}
