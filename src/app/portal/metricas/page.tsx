import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import PortalNav from '@/app/portal/_components/portal-nav'
import PortalMetricas from '@/app/portal/_components/portal-metricas'

const IG_API = 'https://graph.facebook.com/v21.0'

// Métricas sempre usam o FACEBOOK_SYSTEM_TOKEN (tem instagram_manage_insights)
// Fallback para token do cliente se env não estiver configurada
function getInsightsToken(clientToken?: string | null): string {
  return process.env.FACEBOOK_SYSTEM_TOKEN ?? clientToken ?? ''
}

function sumMetric(data: unknown[], name: string): number {
  const metric = (data as Array<{ name: string; values?: Array<{ value: number }> }>)
    .find(m => m.name === name)
  return (metric?.values ?? []).reduce((acc, v) => acc + (v.value ?? 0), 0)
}

async function fetchPeriodInsights(igId: string, t: string, sinceTs: number, untilTs: number) {
  const res = await fetch(
    `${IG_API}/${igId}/insights?metric=reach,impressions&period=day&since=${sinceTs}&until=${untilTs}&access_token=${t}`,
    { next: { revalidate: 3600 } }
  )
  const data = await res.json()
  return {
    reach: sumMetric(data.data ?? [], 'reach'),
    impressions: sumMetric(data.data ?? [], 'impressions'),
  }
}

async function fetchInstagramMetrics(igId: string, token: string) {
  const t = encodeURIComponent(token)
  const now = Math.floor(Date.now() / 1000)
  const d30 = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
  const d60 = Math.floor((Date.now() - 60 * 24 * 60 * 60 * 1000) / 1000)

  const [accountRes, current, previous, mediaRes] = await Promise.all([
    // 1. Dados da conta
    fetch(`${IG_API}/${igId}?fields=followers_count,media_count,name&access_token=${t}`,
      { next: { revalidate: 3600 } }).then(r => r.json()),
    // 2. Insights período atual (últimos 30 dias)
    fetchPeriodInsights(igId, t, d30, now),
    // 3. Insights período anterior (30-60 dias atrás)
    fetchPeriodInsights(igId, t, d60, d30),
    // 4. Posts recentes (12)
    fetch(`${IG_API}/${igId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count,permalink,thumbnail_url,media_url&limit=12&access_token=${t}`,
      { next: { revalidate: 3600 } }).then(r => r.json()),
  ])

  // 5. Insights por post
  const posts = mediaRes.data ?? []
  const postsWithInsights = await Promise.all(
    posts.map(async (post: Record<string, unknown>) => {
      try {
        const piRes = await fetch(
          `${IG_API}/${post.id}/insights?metric=reach,impressions,saved&access_token=${t}`,
          { next: { revalidate: 3600 } }
        )
        const pi = await piRes.json()
        const postMetrics: Record<string, number> = {}
        for (const m of (pi.data ?? [])) {
          postMetrics[m.name] = m.values?.[0]?.value ?? 0
        }
        return { ...post, postMetrics }
      } catch {
        return { ...post, postMetrics: {} }
      }
    })
  )

  return {
    account: accountRes,
    current,
    previous,
    posts: postsWithInsights,
  }
}

export default async function MetricasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const clientId = user.user_metadata?.client_id as string
  if (!clientId) redirect('/portal/login')

  const db = createServiceClient()
  const { data: client } = await db
    .from('clients')
    .select('id, name, instagram_account_id, facebook_page_token')
    .eq('id', clientId)
    .single()

  if (!client) redirect('/portal/login')

  const token = getInsightsToken(client.facebook_page_token)
  const hasConfig = !!(client.instagram_account_id && token)
  let metrics = null
  let error: string | null = null

  if (hasConfig) {
    try {
      metrics = await fetchInstagramMetrics(client.instagram_account_id as string, token)
      if (metrics.account?.error) {
        error = `Erro da API: ${metrics.account.error.message}`
        metrics = null
      }
    } catch {
      error = 'Não foi possível carregar as métricas. Tente novamente mais tarde.'
    }
  }

  return (
    <div>
      <PortalNav clientName={client.name} active="metricas" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold">Métricas</h1>
          <p className="text-slate-400 text-sm mt-1">Desempenho do Instagram — este mês vs mês anterior</p>
        </div>
        <PortalMetricas metrics={metrics} error={error} hasConfig={hasConfig} />
      </main>
    </div>
  )
}
