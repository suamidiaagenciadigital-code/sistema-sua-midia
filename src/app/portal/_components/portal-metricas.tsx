'use client'

type PostMetrics = { reach?: number; impressions?: number; saved?: number }

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
  postMetrics: PostMetrics
}

type Account = {
  followers_count: number
  media_count: number
  name: string
  profile_picture_url?: string
}

type Metrics = {
  account: Account
  totalReach: number
  totalImpressions: number
  posts: Post[]
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString('pt-BR')
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

function MetricCard({
  label, value, icon, sub,
}: {
  label: string; value: string; icon: string; sub?: string
}) {
  return (
    <div className="bg-[#131b2e] rounded-2xl border border-slate-800 px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-white text-3xl font-bold leading-none">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1.5">{sub}</p>}
    </div>
  )
}

export default function PortalMetricas({
  metrics, error, hasConfig,
}: {
  metrics: Metrics | null
  error: string | null
  hasConfig: boolean
}) {
  if (!hasConfig) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <span className="text-4xl">📊</span>
        <p className="text-white font-medium">Instagram não configurado</p>
        <p className="text-slate-500 text-sm">Fale com a agência para ativar as métricas do portal.</p>
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

  const { account, totalReach, totalImpressions, posts } = metrics

  const avgEngagement =
    posts.length > 0
      ? posts.reduce((acc, p) => acc + (p.like_count ?? 0) + (p.comments_count ?? 0), 0) / posts.length
      : 0

  const bestPost = [...posts].sort(
    (a, b) => (b.postMetrics.reach ?? 0) - (a.postMetrics.reach ?? 0)
  )[0]

  return (
    <div className="space-y-8">
      {/* Cards resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Seguidores"
          value={fmt(account.followers_count)}
          icon="👥"
          sub={`${fmt(account.media_count)} publicações no perfil`}
        />
        <MetricCard
          label="Alcance (30d)"
          value={fmt(totalReach)}
          icon="📣"
          sub="contas únicas alcançadas"
        />
        <MetricCard
          label="Impressões (30d)"
          value={fmt(totalImpressions)}
          icon="👁️"
          sub="visualizações totais"
        />
        <MetricCard
          label="Eng. médio / post"
          value={Math.round(avgEngagement).toString()}
          icon="❤️"
          sub="curtidas + comentários"
        />
      </div>

      {/* Melhor publicação */}
      {bestPost && (bestPost.postMetrics.reach ?? 0) > 0 && (
        <div>
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span>🏆</span> Melhor publicação do período
          </h2>
          <div className="bg-[#131b2e] rounded-2xl border border-slate-800 overflow-hidden flex flex-col sm:flex-row">
            {/* Thumb */}
            <div className="w-full sm:w-48 h-48 bg-black flex-shrink-0">
              {bestPost.thumbnail_url || bestPost.media_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={bestPost.thumbnail_url ?? bestPost.media_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 text-3xl">📷</div>
              )}
            </div>

            {/* Dados */}
            <div className="px-5 py-4 flex flex-col justify-between flex-1 min-w-0">
              <div>
                <p className="text-slate-500 text-xs mb-1.5">{fmtDate(bestPost.timestamp)}</p>
                <p className="text-slate-300 text-sm line-clamp-3 leading-relaxed">
                  {bestPost.caption || '(sem legenda)'}
                </p>
              </div>
              <div className="flex items-end justify-between flex-wrap gap-3 mt-4">
                <div className="flex gap-5 flex-wrap">
                  <div>
                    <p className="text-white text-2xl font-bold">{fmt(bestPost.postMetrics.reach ?? 0)}</p>
                    <p className="text-slate-500 text-xs">Alcance</p>
                  </div>
                  <div>
                    <p className="text-white text-2xl font-bold">{fmt(bestPost.postMetrics.impressions ?? 0)}</p>
                    <p className="text-slate-500 text-xs">Impressões</p>
                  </div>
                  <div>
                    <p className="text-white text-2xl font-bold">{fmt(bestPost.like_count ?? 0)}</p>
                    <p className="text-slate-500 text-xs">Curtidas</p>
                  </div>
                  <div>
                    <p className="text-white text-2xl font-bold">{fmt(bestPost.comments_count ?? 0)}</p>
                    <p className="text-slate-500 text-xs">Comentários</p>
                  </div>
                  <div>
                    <p className="text-white text-2xl font-bold">{fmt(bestPost.postMetrics.saved ?? 0)}</p>
                    <p className="text-slate-500 text-xs">Salvamentos</p>
                  </div>
                </div>
                <a
                  href={bestPost.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Ver no Instagram →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid publicações recentes */}
      <div>
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
          <span>📱</span> Publicações recentes
        </h2>
        {posts.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-12">Nenhuma publicação encontrada.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {posts.map(post => (
              <a
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noreferrer"
                className="bg-[#131b2e] rounded-xl border border-slate-800 overflow-hidden hover:border-slate-600 transition-colors group"
              >
                <div className="aspect-square bg-black">
                  {post.thumbnail_url || post.media_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.thumbnail_url ?? post.media_url}
                      alt=""
                      className="w-full h-full object-cover group-hover:opacity-85 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-2xl">📷</div>
                  )}
                </div>
                <div className="px-3 py-2.5 space-y-1">
                  <p className="text-slate-500 text-xs">{fmtDate(post.timestamp)}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
                    <span>📣 {fmt(post.postMetrics.reach ?? 0)}</span>
                    <span>❤️ {fmt(post.like_count ?? 0)}</span>
                    <span>💬 {fmt(post.comments_count ?? 0)}</span>
                  </div>
                  {(post.postMetrics.saved ?? 0) > 0 && (
                    <p className="text-xs text-slate-500">🔖 {fmt(post.postMetrics.saved ?? 0)} salv.</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
