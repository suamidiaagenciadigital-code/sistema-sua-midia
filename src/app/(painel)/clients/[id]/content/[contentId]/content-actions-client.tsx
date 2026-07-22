'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { updateStatusAction } from './actions'

interface Props {
  clientId: string
  contentId: string
  currentStatus: string
  contentType: string
}

export function ContentStatusActions({ clientId, contentId, currentStatus, contentType }: Props) {
  const [revisionNotes, setRevisionNotes] = useState('')
  const [showRevision, setShowRevision] = useState(false)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(true)

  const act = async (status: string, notes?: string) => {
    setLoading(true)
    await updateStatusAction(clientId, contentId, status, notes)
    setLoading(false)
    setShowRevision(false)
  }

  const btnPrimary = (label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      style={{ background: 'linear-gradient(to right, #2B80FF, #A855F7)' }}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      {label}
    </button>
  )

  const btnDanger = (label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      disabled={loading}
      className="rounded-full px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
      style={{
        border: '1px solid rgba(239,68,68,0.4)',
        backgroundColor: 'rgba(239,68,68,0.08)',
        color: '#f87171',
      }}
    >
      {label}
    </button>
  )

  const btnSecondary = (label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      disabled={loading}
      className="rounded-full px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50 hover:text-white"
      style={{
        border: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        color: '#64748b',
      }}
    >
      {label}
    </button>
  )

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: '#131b2e', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Header clicável */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <span className="text-sm font-semibold text-white">Fluxo de aprovação</span>
        {open
          ? <ChevronUp className="h-4 w-4 text-slate-500" />
          : <ChevronDown className="h-4 w-4 text-slate-500" />
        }
      </button>

      {open && (
        <div
          className="px-5 pb-5 space-y-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex flex-wrap gap-2 pt-4">
            {currentStatus === 'draft' && contentType !== 'story' &&
              btnPrimary('Enviar para aprovação', () => act('pending_my_approval'))
            }
            {(currentStatus === 'draft' || currentStatus === 'scheduled') && contentType === 'story' &&
              btnPrimary('Enviar para o cliente', () => act('sent_to_client'))
            }
            {currentStatus === 'scheduled' && contentType === 'story' &&
              btnSecondary('Voltar para rascunho', () => act('draft'))
            }
            {currentStatus === 'pending_my_approval' && (<>
              {btnPrimary('Aprovar', () => act('approved_by_me'))}
              {btnDanger('Pedir revisão', () => setShowRevision(v => !v))}
            </>)}
            {currentStatus === 'approved_by_me' &&
              btnPrimary('Marcar como enviado ao cliente', () => act('sent_to_client'))
            }
            {currentStatus === 'sent_to_client' && (<>
              {btnPrimary('Cliente aprovou', () => act('approved_by_client'))}
              {btnDanger('Cliente pediu revisão', () => setShowRevision(v => !v))}
            </>)}
            {currentStatus === 'approved_by_client' &&
              btnPrimary('Marcar como publicado', () => act('published'))
            }
            {currentStatus === 'revision' &&
              btnPrimary('Enviar para aprovação', () => act('pending_my_approval'))
            }
            {currentStatus !== 'draft' && currentStatus !== 'published' && currentStatus !== 'scheduled' &&
              btnSecondary('Voltar para rascunho', () => act('draft'))
            }
          </div>

          {showRevision && (
            <div className="space-y-2 pt-1">
              <textarea
                value={revisionNotes}
                onChange={e => setRevisionNotes(e.target.value)}
                placeholder="Descreva o que precisa ser revisado..."
                rows={3}
                className="w-full rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none resize-none bg-white/5 border border-white/10"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => act('revision', revisionNotes)}
                  disabled={loading}
                  className="rounded-full px-5 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171',
                  }}
                >
                  Confirmar revisão
                </button>
                <button
                  onClick={() => setShowRevision(false)}
                  className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
