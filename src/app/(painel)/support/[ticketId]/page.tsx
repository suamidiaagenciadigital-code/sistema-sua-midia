import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, MessageSquare, AlertCircle, Star, HelpCircle, Plus, Zap } from 'lucide-react'
import { deleteTicketAction } from './actions'
import { TicketActions } from './ticket-actions-client'

const classLabel: Record<string, string> = {
  pedido: 'Pedido',
  queixa: 'Queixa',
  elogio: 'Elogio',
  duvida: 'Dúvida',
  extra: 'Serviço extra',
  urgente: 'Urgente',
}

const classColor: Record<string, string> = {
  pedido: 'bg-blue-900/30 text-blue-300 border-blue-800',
  queixa: 'bg-red-900/30 text-red-300 border-red-800',
  elogio: 'bg-green-900/30 text-green-300 border-green-800',
  duvida: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  extra: 'bg-purple-900/30 text-purple-300 border-purple-800',
  urgente: 'bg-orange-900/30 text-orange-300 border-orange-800',
}

const classIcon: Record<string, React.ElementType> = {
  pedido: MessageSquare,
  queixa: AlertCircle,
  elogio: Star,
  duvida: HelpCircle,
  extra: Plus,
  urgente: Zap,
}

const statusLabel: Record<string, string> = {
  open: 'Aberto',
  responded: 'Respondido',
  closed: 'Encerrado',
}

const statusColor: Record<string, string> = {
  open: 'bg-yellow-900/30 text-yellow-300 border-yellow-800',
  responded: 'bg-blue-900/30 text-blue-300 border-blue-800',
  closed: 'bg-zinc-800 text-zinc-400 border-zinc-700',
}

interface Props {
  params: Promise<{ ticketId: string }>
}

export default async function TicketDetailPage({ params }: Props) {
  const { ticketId } = await params
  const supabase = await createClient()

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('*, clients(name)')
    .eq('id', ticketId)
    .single()

  if (!ticket) notFound()

  const Icon = classIcon[ticket.classification] ?? MessageSquare
  const del = deleteTicketAction.bind(null, ticketId)

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/support" className="text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-zinc-400" />
              <h1 className="text-2xl font-bold text-white">{(ticket.clients as any)?.name ?? '—'}</h1>
            </div>
            <p className="text-zinc-400 text-sm mt-0.5">
              {new Date(ticket.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ticket.classification && (
            <span className={`text-xs px-2 py-0.5 rounded border font-medium ${classColor[ticket.classification]}`}>
              {classLabel[ticket.classification]}
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded border ${statusColor[ticket.status]}`}>
            {statusLabel[ticket.status]}
          </span>
        </div>
      </div>

      {/* Mensagem original */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-2">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Mensagem do cliente</p>
        <p className="text-sm text-zinc-200 whitespace-pre-wrap">{ticket.original_message}</p>
      </div>

      {/* Sugestão da IA */}
      {ticket.ai_suggested_response && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-5 space-y-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Sugestão da IA</p>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{ticket.ai_suggested_response}</p>
        </div>
      )}

      {/* Resposta registrada */}
      {ticket.final_response && (
        <div className="rounded-lg border border-blue-900/50 bg-blue-950/20 p-5 space-y-2">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Resposta enviada</p>
          <p className="text-sm text-zinc-200 whitespace-pre-wrap">{ticket.final_response}</p>
        </div>
      )}

      {/* Ações */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white">Ações</h2>
        <TicketActions
          ticketId={ticketId}
          status={ticket.status}
          suggestedResponse={ticket.ai_suggested_response}
        />
      </div>

      {/* Excluir */}
      <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-red-400">Zona de perigo</h3>
        <form action={del}>
          <button type="submit"
            className="rounded-md border border-red-800 px-4 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/30 transition-colors">
            Excluir ticket
          </button>
        </form>
      </div>
    </div>
  )
}
