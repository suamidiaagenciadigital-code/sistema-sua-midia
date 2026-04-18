'use client'

import { useState } from 'react'
import { CheckCircle2, MessageSquare, Send, X, Calendar } from 'lucide-react'

interface Props {
  contentId: string
  token: string
}

export default function ApprovalActions({ contentId, token }: Props) {
  const [done, setDone] = useState<'approved' | 'revision' | null>(null)
  const [social, setSocial] = useState<{ facebook: boolean; instagram: boolean; fbError?: string; igError?: string } | null>(null)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const act = async (status: string, revisionNotes?: string) => {
    setLoading(true)
    const res = await fetch('/api/public-approval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, token, status, revisionNotes }),
    })
    const data = await res.json() as {
      ok: boolean
      social?: {
        facebook: { scheduled: boolean; error?: string }
        instagram: { scheduled: boolean; error?: string }
      }
    }

    if (status === 'approved_by_client') {
      setDone('approved')
      setSocial({
        facebook: data.social?.facebook.scheduled ?? false,
        instagram: data.social?.instagram.scheduled ?? false,
        fbError: data.social?.facebook.error,
        igError: data.social?.instagram.error,
      })
    } else {
      setDone('revision')
    }
    setLoading(false)
  }

  if (done === 'approved') {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 py-1">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <span className="text-sm text-green-400 font-medium">Aprovado! A agência foi notificada.</span>
        </div>
        {social && (social.facebook || social.instagram) && (
          <div className="flex items-center gap-2 py-1">
            <Calendar className="h-4 w-4 text-blue-400 shrink-0" />
            <span className="text-xs text-blue-300">
              Agendado automaticamente em:{' '}
              {[social.facebook && 'Facebook', social.instagram && 'Instagram']
                .filter(Boolean)
                .join(' e ')}
            </span>
          </div>
        )}
        {social && !social.facebook && social.fbError && (
          <div className="flex items-center gap-2 py-1">
            <Calendar className="h-4 w-4 text-zinc-500 shrink-0" />
            <span className="text-xs text-zinc-400">
              Facebook: será publicado manualmente pela agência.
            </span>
          </div>
        )}
        {social && !social.instagram && social.igError && (
          <div className="flex items-center gap-2 py-1">
            <Calendar className="h-4 w-4 text-zinc-500 shrink-0" />
            <span className="text-xs text-zinc-400">
              Instagram: será publicado manualmente pela agência.
            </span>
          </div>
        )}
      </div>
    )
  }

  if (done === 'revision') {
    return (
      <div className="flex items-center gap-2 py-2">
        <MessageSquare className="h-5 w-5 text-orange-400" />
        <span className="text-sm text-orange-300 font-medium">Alteração solicitada. A agência vai ajustar.</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {!showNotes ? (
        /* Barra de ações estilo Instagram */
        <div className="flex items-center gap-4 pt-1">
          <button
            onClick={() => act('approved_by_client')}
            disabled={loading}
            className="flex items-center gap-1.5 text-green-400 hover:text-green-300 transition-colors disabled:opacity-40"
            title="Aprovar"
          >
            <CheckCircle2 className="h-6 w-6" />
            <span className="text-sm font-medium">Aprovar</span>
          </button>

          <button
            onClick={() => setShowNotes(true)}
            disabled={loading}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-orange-400 transition-colors disabled:opacity-40"
            title="Pedir alteração"
          >
            <MessageSquare className="h-6 w-6" />
            <span className="text-sm font-medium">Pedir alteração</span>
          </button>
        </div>
      ) : (
        /* Campo de correção inline */
        <div className="space-y-2 pt-1">
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="O que precisa ser alterado nesta publicação?"
              rows={3}
              autoFocus
              className="flex-1 bg-transparent border-b border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none py-1"
            />
          </div>
          <div className="flex items-center justify-between pl-9">
            <button
              onClick={() => { setShowNotes(false); setNotes('') }}
              className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Cancelar
            </button>
            <button
              onClick={() => act('revision', notes)}
              disabled={loading || !notes.trim()}
              className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
            >
              <Send className="h-3 w-3" />
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
