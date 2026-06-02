'use client'

type Post = {
  id: string
  caption?: string
  media_type: string
  timestamp: string
  like_count: number
  comments_count: number
  permalink: string
  thumbnail_url?: string
  media_url?: string
  postMetrics: { reach?: number; impressions?: number; saved?: number }
}

type Period = { reach: number; impressions: number }

type Metrics = {
  account: { followers_count: number; media_count: number; name: string }
  current: Period
  previous: Period
  posts: Post[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString('pt-BR')
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

function pct(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function GrowthBadge({ current, previous }: { current: number; previous: number }) {
  const diff = pct(current, previous)
  if (diff === null) return null
  const up = diff >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
      up ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/50'
         : 'text-red-400 bg-red-950/60 border border-red-800/50'
    }`}>
      {up ? '▲' : '▼'} {Math.abs(diff)}%
    </span>
  )
}

function SummaryCard({ label, value, icon, current, previous, sub }: {
  label: string; value: string; icon: string
  current: number; previous: number; sub?: string
}) {
  return (
    <div className="bg-[#131b2e] rounded-2xl border border-slate-800 px-5 py-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</span>
        </div>
        <GrowthBadge current={current} previous={previous} />
      </div>
      <p className="text-white text-3xl font-bold leading-none">{value}</p>
      {sub && <p className="text-slate-500 text-xs">{sub}</p>}
    </div>
  )
}

function ProgressBar({ value, max, color = 'blue' }: { value: number; max: number; color?: 'blue' | 'slate' }) {
  const pctVal = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${pctVal}%`,
          background: color === 'blue'
            ? 'linear-gradient(to right, #2B80FF, #A855F7)'
            : '#334155',
        }}
      />
    </div>
  )
}

function CompareBar({ label, icon, current, previous }: {
  label: string; icon: string; current: number; previous: number
}) {
  const maxVal = Math.max(current, previous, 1)
  const diff = current - previous
  const diffPct = pct(current, previous)
  const up = diff >= 0

  return (
    <div className="bg-[#131b2e] rounded-2xl border border-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-white font-semibold text-sm">{label}</span>
        </div>
        {diffPct !== null && (
          <span className={`text-xs font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
            {up ? '▲' : '▼'} {Math.abs(diffPct)}% vs mês passado
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Este mês */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Este mês</span>
            <span className="text-white font-bold">{fmt(current)}</span>
          </div>
          <ProgressBar value={current} max={maxVal} color="blue" />
        </div>

        {/* Mês passado */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Mês passado</span>
            <span className="text-slate-400 font-semibold">{fmt(previous)}</span>
          </div>
          <ProgressBar value={previous} max={maxVal} color="slate" />
        </div>
      </div>
    </div>
  )
}

function PostCard({ post, rank }: { post: Post; rank?: number }) {
  const thumb = post.thumbnail_url ?? post.media_url
  const reach = post.postMetrics.reach ?? 0
  const engagement = (post.like_count ?? 0) + (post.comments_count ?? 0)

  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noreferrer"
      className="bg-[#131b2e] rounded-xl border border-slate-800 overflow-hidden hover:border-slate-600 transition-colors group block"
    >
      <div className="relative aspect-square bg-black">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="w-full h-full object-cover group-hover:opacity-85 transition-opacity" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 text-2xl">📷</div>
        )}
        {rank && (
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : '#b45309' }}>
            {rank}
          </div>
        )}
      </div>

      <div className="px-3 py-2.5 space-y-1.5">
        <p className="text-slate-500 text-xs">{fmtDate(post.timestamp)}</p>
        <div className="grid grid-cols-3 gap-1 text-center">
          <div>
            <p className="text-white text-sm font-bold">{fmt(reach)}</p>
            <p className="text-slate-600 text-[10px]">alcance</p>
          </div>
          <div>
            <p className="text-white text-sm font-bold">{fmt(post.like_count ?? 0)}</p>
            <p className="text-slate-600 text-[10px]">curtidas</p>
          </div>
          <div>
            <p className="text-white text-sm font-bold">{fmt(engagement)}</p>
            <p className="text-slate-600 text-[10px]">eng.</p>
          </div>
        </div>
      </div>
    </a>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function PortalMetricas({ metrics, error, hasConfig, monthLabel, prevLabel }: {
  metrics: Metrics | null
  error: string | null
  hasConfig: boolean
  monthLabel?: string
  prevLabel?: string
}) {
  if (!hasConfig) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <span className="text-4xl">📊</span>
        <p className="text-white font-medium">Instagram não configurado</p>
        <p className="text-slate-500 text-sm">Fale com a agência para ativar as métricas.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <span className="text-4xl">⚠️</span>
        <p className="text-white font-medium">Erro ao carregar métricas</p>
        <p className="text-slate-500 text-sm">{error}</p>
      </div>
    )
  }

  if (!metrics) return null

  const { account, current, previous, posts } = metrics

  const avgEngagement = posts.length > 0
    ? Math.round(posts.reduce((acc, p) => acc + (p.like_count ?? 0) + (p.comments_count ?? 0), 0) / posts.length)
    : 0

  const prevAvgEngagement = 0 // sem dados históricos de posts do mês passado

  // Top 3 por alcance
  const top3 = [...posts]
    .sort((a, b) => (b.postMetrics.reach ?? 0) - (a.postMetrics.reach ?? 0))
    .slice(0, 3)

  // Demais posts
  const recentPosts = posts.slice(0, 12)

  return (
    <div className="space-y-8">

      {/* ── Cards de resumo ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          label="Seguidores"
          value={fmt(account.followers_count)}
          icon="👥"
          current={account.followers_count}
          previous={account.followers_count} // sem dado histórico de seguidores
          sub={`${fmt(account.media_count)} publicações`}
        />
        <SummaryCard
          label="Alcance"
          value={fmt(current.reach)}
          icon="📣"
          current={current.reach}
          previous={previous.reach}
          sub="contas únicas alcançadas"
        />
        <SummaryCard
          label="Impressões"
          value={fmt(current.impressions)}
          icon="👁️"
          current={current.impressions}
          previous={previous.impressions}
          sub="visualizações totais"
        />
        <SummaryCard
          label="Eng. médio"
          value={fmt(avgEngagement)}
          icon="❤️"
          current={avgEngagement}
          previous={prevAvgEngagement}
          sub="curtidas + comentários / post"
        />
      </div>

      {/* ── Barras de progresso comparativas ── */}
      <div>
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
          <span>📈</span> {monthLabel ?? 'Este mês'} vs {prevLabel ?? 'Mês anterior'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CompareBar
            label="Alcance"
            icon="📣"
            current={current.reach}
            previous={previous.reach}
          />
          <CompareBar
            label="Impressões"
            icon="👁️"
            current={current.impressions}
            previous={previous.impressions}
          />
          <CompareBar
            label="Engajamento médio"
            icon="❤️"
            current={avgEngagement}
            previous={avgEngagement} // placeholder — sem histórico de posts passados
          />
        </div>
      </div>

      {/* ── Top 3 posts ── */}
      {top3.length > 0 && (
        <div>
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span>🏆</span> Top 3 publicações por alcance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {top3.map((post, i) => (
              <PostCard key={post.id} post={post} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* ── Publicações recentes ── */}
      <div>
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
          <span>📱</span> Publicações recentes
        </h2>
        {recentPosts.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-12">Nenhuma publicação encontrada.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {recentPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
