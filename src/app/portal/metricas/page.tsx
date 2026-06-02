import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import PortalNav from '@/app/portal/_components/portal-nav'
import PortalMetricas from '@/app/portal/_components/portal-metricas'
import { MonthSelector } from '@/app/portal/_components/month-selector'

const IG_API = 'https://graph.facebook.com/v21.0'

// Métricas sempre usam o FACEBOOK_SYSTEM_TOKEN (tem instagram_manage_insights)
function getInsightsToken(clientToken?: string | null): string {
  return process.env.FACEBOOK_SYSTEM_TOKEN ?? clientToken ?? ''
}

function parseMonth(ym: string): { year: number; month: number } {
  const [y, m] = ym.split('-').map(Number)
  return { year: y, month: m }
}

function monthRange(year: number, month: number): { since: number; until: number } {
  const since = Math.floor(new Date(year, month - 1, 1).getTime() / 1000)
  const until  = Math.floor(new Date(year, month, 0, 23, 59, 59).getTime() / 1000)
  return { since, until }
}

function prevMonth(year: number, month: number): { year: number; month: number } {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
}

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

async function fetchPeriodInsights(igId: string, t: string, since: number, until: number) {
  const res = await fetch(
    `${IG_API}/${igId}/insights?metric=reach,impressions&period=day&since=${since}&until=${until}&access_token=${t}`,
    { cache: 'no-store' }
  )
  const data = await res.json()

  if (data.error) {
    console.error('[metrics insights error]', JSON.stringify(data.error))
    return { reach: 0, impressions: 0, apiError: data.error.message as string }
  }

  let reach = 0
  let impressions = 0
  for (const m of data.data ?? []) {
    const sum = (m.values ?? []).reduce((acc: number, v: { value: number }) => acc + (v.value ?? 0), 0)
    if (m.name === 'reach')       reach = sum
    if (m.name === 'impressions') impressions = sum
  }
  return { reach, impressions, apiError: null }
}

async function fetchInstagramMetrics(igId: string, token: string, year: number, month: number) {
  const t = encodeURIComponent(token)
  const curr = monthRange(year, month)
  const prev = prevMonth(year, month)
  const prevRange = monthRange(prev.year, prev.month)

  const [accountData, current, previous, mediaData] = await Promise.all([
    fetch(`${IG_API}/${igId}?fields=followers_count,media_count,name&access_token=${t}`, { cache: 'no-store' }).then(r => r.json()),
    fetchPeriodInsights(igId, t, curr.since, curr.until),
    fetchPeriodInsights(igId, t, prevRange.since, prevRange.until),
    fetch(`${IG_API}/${igId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count,permalink,thumbnail_url,media_url&limit=12&access_token=${t}`, { cache: 'no-store' }).then(r => r.json()),
  ])

  if (accountData.error) {
    throw new Error(`Conta: ${accountData.error.message}`)
  }

  // Expõe erro da API de insights para diagnóstico
  const insightsError = current.apiError ?? previous.apiError

  // Posts com insights
  const posts = mediaData.data ?? []
  const postsWithInsights = await Promise.all(
    posts.map(async (post: Record<string, unknown>) => {
      try {
        const r = await fetch(
          `${IG_API}/${post.id}/insights?metric=reach,impressions,saved&access_token=${t}`,
          { cache: 'no-store' }
        )
        const pi = await r.json()
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

  return { account: accountData, current, previous, posts: postsWithInsights, insightsError }
}

interface Props {
  searchParams: Promise<{ month?: string }>
}

export default async function MetricasPage({ searchParams }: Props) {
  const sp = await searchParams
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

  // Mês selecionado (padrão: mês atual)
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const selectedMonth = sp.month ?? defaultMonth
  const { year, month } = parseMonth(selectedMonth)
  const { year: prevY, month: prevM } = prevMonth(year, month)

  const token = getInsightsToken(client.facebook_page_token)
  const hasConfig = !!(client.instagram_account_id && token)

  let metrics = null
  let error: string | null = null

  if (hasConfig) {
    try {
      metrics = await fetchInstagramMetrics(client.instagram_account_id as string, token, year, month)
      if (metrics.insightsError) {
        // Não bloqueia a página — mostra o erro mas exibe o que conseguiu
        error = `Alcance/Impressões indisponíveis: ${metrics.insightsError}`
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Erro ao carregar métricas.'
    }
  }

  const monthLabel = `${MONTHS_PT[month - 1]} ${year}`
  const prevLabel  = `${MONTHS_PT[prevM - 1]} ${prevY}`

  return (
    <div>
      <PortalNav clientName={client.name} active="metricas" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-white text-2xl font-bold">Métricas</h1>
            <p className="text-slate-400 text-sm mt-1">
              {monthLabel} vs {prevLabel}
            </p>
          </div>
          <MonthSelector selected={selectedMonth} />
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-yellow-950/40 border border-yellow-800/50 text-yellow-400 text-xs">
            ⚠️ {error}
          </div>
        )}

        <PortalMetricas
          metrics={metrics}
          error={metrics ? null : (error ?? null)}
          hasConfig={hasConfig}
          monthLabel={monthLabel}
          prevLabel={prevLabel}
        />
      </main>
    </div>
  )
}
