import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MessageSquare, AlertCircle, Star, HelpCircle, Plus, Zap } from 'lucide-react'

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

export default async function SupportPage() {
  const supabase = await createClient()

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*, clients(name)')
    .order('created_at', { ascending: false })

  const open = tickets?.filter(t => t.status === 'open') ?? []
  const other = tickets?.filter(t => t.status !== 'open') ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Atendimento</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {open.length} aberto{open.length !== 1 ? 's' : ''} · {tickets?.length ?? 0} total
          </p>
        </div>
        <Link
          href="/support/new"
          className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo ticket
        </Link>
      </div>

      {/* Abertos */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          Abertos
          <span className="text-xs bg-yellow-900/40 text-yellow-300 border border-yellow-800 px-1.5 py-0.5 rounded-full">{open.length}</span>
        </h2>
        {open.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-600 text-sm">
            Nenhum atendimento aberto
          </div>
        ) : (
          <div className="space-y-2">
            {open.map(t => <TicketCard key={t.id} t={t} />)}
          </div>
        )}
      </section>

      {/* Histórico */}
      {other.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500">Histórico</h2>
          <div className="space-y-2">
            {other.map(t => <TicketCard key={t.id} t={t} />)}
          </div>
        </section>
      )}
    </div>
  )

  function TicketCard({ t }: { t: any }) {
    const Icon = classIcon[t.classification] ?? MessageSquare
    return (
      <Link
        href={`/support/${t.id}`}
        className="flex items-start gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-600 transition-colors"
      >
        <div className="mt-0.5 p-2 rounded-md bg-zinc-800">
          <Icon className="h-4 w-4 text-zinc-400" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white">{(t.clients as any)?.name ?? '—'}</span>
            {t.classification && (
              <span className={`text-xs px-2 py-0.5 rounded border font-medium ${classColor[t.classification]}`}>
                {classLabel[t.classification]}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded border ${statusColor[t.status]}`}>
              {statusLabel[t.status]}
            </span>
          </div>
          <p className="text-sm text-zinc-400 truncate">{t.original_message}</p>
          {t.ai_suggested_response && (
            <p className="text-xs text-zinc-600 truncate">IA: {t.ai_suggested_response}</p>
          )}
          <p className="text-xs text-zinc-600">
            {new Date(t.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <span className="text-xs text-zinc-600 shrink-0">Ver →</span>
      </Link>
    )
  }
}
