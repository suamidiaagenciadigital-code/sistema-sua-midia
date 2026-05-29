import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import PortalNav from '@/app/portal/_components/portal-nav'
import PortalMetricas from '@/app/portal/_components/portal-metricas'

const IG_API = 'https://graph.facebook.com/v21.0'

async function fetchInstagramMetrics(igId: string, token: string) {
  const t = encodeURIComponent(token)

  // 1. Dados da conta
  const accountRes = await fetch(
    `${IG_API}/${igId}?fields=followers_count,media_count,name,profile_picture_url&access_token=${t}`,
    { next: { revalidate: 3600 } }
  )
  const account = await accountRes.json()

  // 2. Insights da conta — últimos 30 dias
  const since = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
  const until = Math.floor(Date.now() / 1000)
  const insightsRes = await fetch(
    `${IG_API}/${igId}/insights?metric=reach,impressions&period=day&since=${since}&until=${until}&access_token=${t}`,
    { next: { revalidate: 3600 } }
  )
  const insightsData = await insightsRes.json()

  let totalReach = 0
  let totalImpressions = 0
  for (const metric of insightsData.data ?? []) {
    const sum = (metric.values ?? []).reduce((acc: number, v: { value: number }) => acc + (v.value ?? 0), 0)
    if (metric.name === 'reach') totalReach = sum
    if (metric.name === 'impressions') totalImpressions = sum
  }

  // 3. Mídias recentes
  const mediaRes = await fetch(
    `${IG_API}/${igId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count,permalink,thumbnail_url,media_url&limit=12&access_token=${t}`,
    { next: { revalidate: 3600 } }
  )
  const mediaData = await mediaRes.json()
  const posts = mediaData.data ?? []

  // 4. Insights por post (em paralelo)
  const postsWithInsights = await Promise.all(
    posts.map(async (post: Record<string, unknown>) => {
      try {
        const piRes = await fetch(
          `${IG_API}/${post.id}/insights?metric=reach,impressions,saved&access_token=${t}`,
          { next: { revalidate: 3600 } }
        )
        const pi = await piRes.json()
        const postMetrics: Record<string, number> = {}
        for (const m of pi.data ?? []) {
          postMetrics[m.name] = m.values?.[0]?.value ?? 0
        }
        return { ...post, postMetrics }
      } catch {
        return { ...post, postMetrics: {} }
      }
    })
  )

  return { account, totalReach, totalImpressions, posts: postsWithInsights }
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

  const hasConfig = !!(client.instagram_account_id && client.facebook_page_token)
  let metrics = null
  let error: string | null = null

  if (hasConfig) {
    try {
      metrics = await fetchInstagramMetrics(
        client.instagram_account_id as string,
        client.facebook_page_token as string
      )
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
          <p className="text-slate-400 text-sm mt-1">Desempenho do Instagram nos últimos 30 dias</p>
        </div>
        <PortalMetricas metrics={metrics} error={error} hasConfig={hasConfig} />
      </main>
    </div>
  )
}
