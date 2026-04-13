'use client'

import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

interface Props {
  contentId: string
  token: string
}

export default function ApprovalActions({ contentId, token }: Props) {
  const [done, setDone] = useState<'approved' | 'revision' | null>(null)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const act = async (status: string, revisionNotes?: string) => {
    setLoading(true)
    await fetch('/api/public-approval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, token, status, revisionNotes }),
    })
    setDone(status === 'approved_by_client' ? 'approved' : 'revision')
    setLoading(false)
  }

  if (done === 'approved') {
    return (
      <div className="flex items-center gap-2 text-green-400 py-2">
        <CheckCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Aprovado! A agência foi notificada.</span>
      </div>
    )
  }

  if (done === 'revision') {
    return (
      <div className="flex items-center gap-2 text-orange-400 py-2">
        <XCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Revisão solicitada. A agência vai ajustar.</span>
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-2 border-t border-zinc-800">
      {!showNotes ? (
        <div className="flex gap-2">
          <button
            onClick={() => act('approved_by_client')}
            disabled={loading}
            className="flex items-center gap-2 rounded-md bg-green-700 hover:bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            Aprovar
          </button>
          <button
            onClick={() => setShowNotes(true)}
            disabled={loading}
            className="flex items-center gap-2 rounded-md border border-orange-800 text-orange-400 hover:bg-orange-900/30 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Pedir alteração
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Descreva o que precisa ser alterado..."
            rows={3}
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() => act('revision', notes)}
              disabled={loading || !notes.trim()}
              className="rounded-md bg-orange-700 hover:bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              Enviar solicitação
            </button>
            <button onClick={() => setShowNotes(false)} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
