'use client'

import { useTransition, useState } from 'react'
import { respondTicketAction, closeTicketAction, reopenTicketAction } from './actions'

interface Props {
  ticketId: string
  status: string
  suggestedResponse: string | null
}

export function TicketActions({ ticketId, status, suggestedResponse }: Props) {
  const [pending, startTransition] = useTransition()
  const [response, setResponse] = useState(suggestedResponse ?? '')

  const respond = respondTicketAction.bind(null, ticketId)
  const close = closeTicketAction.bind(null, ticketId)
  const reopen = reopenTicketAction.bind(null, ticketId)

  const base = "w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"

  return (
    <div className="space-y-4">
      {status !== 'closed' && (
        <form action={respond} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-300">Resposta ao cliente</label>
            <textarea
              name="response"
              rows={5}
              value={response}
              onChange={e => setResponse(e.target.value)}
              placeholder="Digite a resposta para enviar ao cliente..."
              className={base}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              Marcar como respondido
            </button>
            {status === 'responded' && (
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => close())}
                className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-50"
              >
                Encerrar ticket
              </button>
            )}
          </div>
        </form>
      )}

      {status === 'open' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => close())}
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-50"
        >
          Encerrar sem responder
        </button>
      )}

      {status === 'closed' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => reopen())}
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-50"
        >
          Reabrir ticket
        </button>
      )}
    </div>
  )
}
