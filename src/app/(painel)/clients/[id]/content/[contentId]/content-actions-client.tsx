'use client'

import { useState } from 'react'
import { updateStatusAction } from './actions'

interface Props {
  clientId: string
  contentId: string
  currentStatus: string
}

export function ContentStatusActions({ clientId, contentId, currentStatus }: Props) {
  const [revisionNotes, setRevisionNotes] = useState('')
  const [showRevision, setShowRevision] = useState(false)
  const [loading, setLoading] = useState(false)

  const act = async (status: string, notes?: string) => {
    setLoading(true)
    await updateStatusAction(clientId, contentId, status, notes)
    setLoading(false)
    setShowRevision(false)
  }

  const btn = (label: string, onClick: () => void, variant: 'primary' | 'danger' | 'secondary' = 'secondary') => (
    <button
      onClick={onClick}
      disabled={loading}
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
        variant === 'primary' ? 'bg-white text-zinc-900 hover:bg-zinc-100' :
        variant === 'danger' ? 'border border-red-800 text-red-400 hover:bg-red-900/30' :
        'border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {currentStatus === 'draft' && (
          btn('Enviar para aprovação', () => act('pending_my_approval'), 'primary')
        )}
        {currentStatus === 'pending_my_approval' && (<>
          {btn('Aprovar', () => act('approved_by_me'), 'primary')}
          {btn('Pedir revisão', () => setShowRevision(v => !v), 'danger')}
        </>)}
        {currentStatus === 'approved_by_me' && (
          btn('Marcar como enviado ao cliente', () => act('sent_to_client'), 'primary')
        )}
        {currentStatus === 'sent_to_client' && (<>
          {btn('Cliente aprovou', () => act('approved_by_client'), 'primary')}
          {btn('Cliente pediu revisão', () => setShowRevision(v => !v), 'danger')}
        </>)}
        {currentStatus === 'approved_by_client' && (
          btn('Marcar como publicado', () => act('published'), 'primary')
        )}
        {currentStatus === 'revision' && (
          btn('Enviar para aprovação', () => act('pending_my_approval'), 'primary')
        )}
        {currentStatus !== 'draft' && currentStatus !== 'published' && (
          btn('Voltar para rascunho', () => act('draft'))
        )}
      </div>

      {showRevision && (
        <div className="space-y-2">
          <textarea
            value={revisionNotes}
            onChange={e => setRevisionNotes(e.target.value)}
            placeholder="Descreva o que precisa ser revisado..."
            rows={3}
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() => act('revision', revisionNotes)}
              disabled={loading}
              className="rounded-md bg-red-900/50 border border-red-800 px-4 py-1.5 text-sm text-red-300 hover:bg-red-900/70 transition-colors disabled:opacity-50"
            >
              Confirmar revisão
            </button>
            <button onClick={() => setShowRevision(false)} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
