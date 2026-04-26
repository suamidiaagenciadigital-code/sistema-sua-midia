import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CheckSquare, Clock } from 'lucide-react'
import { STATUS_COLOR, STATUS_LABEL, TYPE_ICON, TYPE_LABEL, ContentStatus } from '@/lib/content-status'

export const dynamic = 'force-dynamic'

export default async function ApprovalsPage() {
  const supabase = await createClient()

  const { data: contents } = await supabase
    .from('contents')
    .select('id, title, type, status, scheduled_date, created_at, caption, revision_notes, revision_count, client_id, clients(name)')
    .in('status', ['pending_my_approval', 'revision', 'sent_to_client'])
    .order('created_at', { ascending: false })

  const pending = contents?.filter(c => c.status === 'pending_my_approval') ?? []
  const revision = contents?.filter(c => c.status === 'revision') ?? []
  const sentToClient = contents?.filter(c => c.status === 'sent_to_client') ?? []

  const ContentCard = ({ c }: { c: any }) => (
    <Link
      href={`/clients/${c.client_id}/content/${c.id}`}
      className="block rounded-lg border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-600 transition-colors space-y-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">{TYPE_ICON[c.type]}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{c.title}</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {(c.clients as any)?.name} · {TYPE_LABEL[c.type]}
              {c.scheduled_date && ` · ${new Date(c.scheduled_date + 'T12:00:00').toLocaleDateString('pt-BR')}`}
            </p>
          </div>
        </div>
        <span className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${STATUS_COLOR[c.status as ContentStatus]}`}>
          {STATUS_LABEL[c.status as ContentStatus]}
        </span>
      </div>
      {c.caption && (
        <p className="text-xs text-zinc-400 line-clamp-2">{c.caption}</p>
      )}
      {c.revision_notes && (
        <div className="rounded bg-orange-950/30 border border-orange-900/50 px-2 py-1">
          <p className="text-xs text-orange-400">Revisão: {c.revision_notes}</p>
        </div>
      )}
      <p className="text-xs text-zinc-600">Clique para ver e aprovar →</p>
    </Link>
  )

  const Section = ({ title, items, icon: Icon, empty }: {
    title: string; items: any[]; icon: React.ElementType; empty: string
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-zinc-400" />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <span className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-600">
          <p className="text-sm">{empty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {items.map(c => <ContentCard key={c.id} c={c} />)}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Fila de aprovações</h1>
        <p className="text-zinc-400 text-sm mt-1">
          {(contents?.length ?? 0) === 0
            ? 'Nenhum conteúdo pendente'
            : `${contents?.length} conteúdo${contents?.length !== 1 ? 's' : ''} aguardando ação`}
        </p>
      </div>

      <Section
        title="Aguardando minha aprovação"
        items={pending}
        icon={Clock}
        empty="Nenhum conteúdo aguardando sua aprovação"
      />
      <Section
        title="Para revisar"
        items={revision}
        icon={CheckSquare}
        empty="Nenhum conteúdo para revisar"
      />
      <Section
        title="Enviado ao cliente — aguardando resposta"
        items={sentToClient}
        icon={CheckSquare}
        empty="Nenhum conteúdo aguardando resposta do cliente"
      />
    </div>
  )
}
