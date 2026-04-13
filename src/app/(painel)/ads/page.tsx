import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Target, TrendingUp } from 'lucide-react'

const statusLabel: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativa',
  paused: 'Pausada',
  completed: 'Encerrada',
}

const statusColor: Record<string, string> = {
  draft: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  active: 'bg-green-900/30 text-green-300 border-green-800',
  paused: 'bg-yellow-900/30 text-yellow-300 border-yellow-800',
  completed: 'bg-zinc-800 text-zinc-500 border-zinc-700',
}

export default async function AdsPage() {
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from('ad_campaigns')
    .select('*, clients(name)')
    .order('created_at', { ascending: false })

  const active = campaigns?.filter(c => c.status === 'active') ?? []
  const other = campaigns?.filter(c => c.status !== 'active') ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Anúncios</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {active.length} ativ{active.length !== 1 ? 'as' : 'a'} · {campaigns?.length ?? 0} total
          </p>
        </div>
        <Link
          href="/ads/new"
          className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova campanha
        </Link>
      </div>

      {/* Ativas */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          Ativas
          <span className="text-xs bg-green-900/40 text-green-300 border border-green-800 px-1.5 py-0.5 rounded-full">{active.length}</span>
        </h2>
        {active.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-600 text-sm">
            Nenhuma campanha ativa
          </div>
        ) : (
          <div className="space-y-2">
            {active.map(c => <CampaignCard key={c.id} c={c} />)}
          </div>
        )}
      </section>

      {/* Histórico */}
      {other.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500">Histórico</h2>
          <div className="space-y-2">
            {other.map(c => <CampaignCard key={c.id} c={c} />)}
          </div>
        </section>
      )}
    </div>
  )

  function CampaignCard({ c }: { c: any }) {
    return (
      <Link
        href={`/ads/${c.id}`}
        className="flex items-start gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-600 transition-colors"
      >
        <div className="mt-0.5 p-2 rounded-md bg-zinc-800">
          <Target className="h-4 w-4 text-zinc-400" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white">{(c.clients as any)?.name ?? '—'}</span>
            <span className={`text-xs px-2 py-0.5 rounded border ${statusColor[c.status]}`}>
              {statusLabel[c.status]}
            </span>
          </div>
          <p className="text-sm text-zinc-400 truncate">{c.objective}</p>
          {c.budget && <p className="text-xs text-zinc-600">Verba: {c.budget} · Período: {c.period}</p>}
          <p className="text-xs text-zinc-600">
            {new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <span className="text-xs text-zinc-600 shrink-0">Ver →</span>
      </Link>
    )
  }
}
