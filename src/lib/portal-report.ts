import { createServiceClient } from '@/lib/supabase/server'

const GRAPH = 'https://graph.facebook.com/v21.0'

// ── Campos do resumo ──────────────────────────────────────────────────────

export const IG_FIELDS = [
  { key: 'views', label: 'Visualizações', hint: 'Quantas vezes o conteúdo foi visto' },
  { key: 'reach', label: 'Alcance', hint: 'Contas diferentes alcançadas' },
  { key: 'interactions', label: 'Interações', hint: 'Curtidas, comentários, salvamentos e compartilhamentos' },
  { key: 'profile_views', label: 'Visitas ao perfil', hint: '' },
  { key: 'new_followers', label: 'Novos seguidores', hint: '' },
  { key: 'followers_total', label: 'Seguidores (total)', hint: 'Total no fim do mês' },
] as const

export const AD_FIELDS = [
  { key: 'ads_spend', label: 'Investido em anúncios (R$)', hint: '' },
  { key: 'ads_reach', label: 'Alcance dos anúncios', hint: '' },
  { key: 'ads_clicks', label: 'Cliques', hint: '' },
  { key: 'ads_results', label: 'Resultados', hint: 'Ex.: mensagens, leads, visitas' },
] as const

export type NumKey = (typeof IG_FIELDS)[number]['key'] | (typeof AD_FIELDS)[number]['key']

export interface TopPost {
  caption: string
  permalink: string
  media_type: string
  likes: number
  comments: number
}

export type ReportValues = Partial<Record<NumKey, number>> & {
  ads_results_label?: string
  top_post?: TopPost
}

export interface PostCounts {
  published: number
  feed: number
  stories: number
  reels: number
  carousels: number
  images: number
  upcoming: number
}

export interface MonthReport {
  month: string
  values: ReportValues // automático + manual já mesclados
  auto: ReportValues
  overrides: ReportValues
  note: string
  highlight: string
  posts: PostCounts
  igError: string | null
}

// ── Meses ─────────────────────────────────────────────────────────────────

export function currentMonth(): string {
  const d = new Date(Date.now() - 3 * 3600 * 1000) // Brasília
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function isValidMonth(ym: string | undefined): ym is string {
  return !!ym && /^\d{4}-(0[1-9]|1[0-2])$/.test(ym)
}

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return `${MONTHS_PT[m - 1]} ${y}`
}

function monthDates(ym: string): { first: string; last: string } {
  const [y, m] = ym.split('-').map(Number)
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return { first: `${ym}-01`, last: `${ym}-${String(lastDay).padStart(2, '0')}` }
}

// ── Publicações (do nosso banco — não depende do Meta) ─────────────────────

export async function countPosts(clientId: string, ym: string): Promise<PostCounts> {
  const db = createServiceClient()
  const { first, last } = monthDates(ym)
  const { data } = await db
    .from('contents')
    .select('type, status')
    .eq('client_id', clientId)
    .gte('scheduled_date', first)
    .lte('scheduled_date', last)
    .in('status', ['published', 'approved_by_client', 'scheduled'])

  const c: PostCounts = { published: 0, feed: 0, stories: 0, reels: 0, carousels: 0, images: 0, upcoming: 0 }
  for (const row of data ?? []) {
    if (row.status !== 'published') { c.upcoming++; continue }
    c.published++
    if (row.type === 'story') c.stories++
    else {
      c.feed++
      if (row.type === 'reel') c.reels++
      else if (row.type === 'carrossel') c.carousels++
      else c.images++
    }
  }
  return c
}

// ── Instagram (API) ───────────────────────────────────────────────────────

async function gj(url: string): Promise<any> {
  const r = await fetch(url, { cache: 'no-store' })
  return r.json()
}

// A API recusa janelas acima de 30 dias — em meses de 31 dias o último dia fica de fora.
function igWindow(ym: string): { since: number; until: number } | null {
  const [y, m] = ym.split('-').map(Number)
  const since = Math.floor(Date.UTC(y, m - 1, 1, 3) / 1000) // 00:00 Brasília
  const endOfMonth = Math.floor(Date.UTC(y, m, 1, 3) / 1000) - 1
  const now = Math.floor(Date.now() / 1000)
  if (since > now) return null
  return { since, until: Math.min(endOfMonth, now, since + 30 * 86400 - 1) }
}

async function fetchInstagram(
  igId: string,
  token: string,
  ym: string,
  isCurrent: boolean,
): Promise<{ values: ReportValues; error: string | null }> {
  const w = igWindow(ym)
  if (!w) return { values: {}, error: null }
  const t = encodeURIComponent(token)
  const total = (metric: string) =>
    gj(`${GRAPH}/${igId}/insights?metric=${metric}&metric_type=total_value&period=day&since=${w.since}&until=${w.until}&access_token=${t}`)

  const [reach, views, inter, prof, fol, acct, media] = await Promise.all([
    total('reach'),
    total('views'),
    total('total_interactions'),
    total('profile_views'),
    gj(`${GRAPH}/${igId}/insights?metric=follower_count&period=day&since=${w.since}&until=${w.until}&access_token=${t}`),
    isCurrent ? gj(`${GRAPH}/${igId}?fields=followers_count&access_token=${t}`) : Promise.resolve(null),
    gj(`${GRAPH}/${igId}/media?fields=caption,media_type,timestamp,like_count,comments_count,permalink&limit=100&access_token=${t}`),
  ])

  const values: ReportValues = {}
  let error: string | null = null
  const read = (res: any, key: NumKey) => {
    if (res?.error) { error ??= res.error.message; return }
    const v = res?.data?.[0]?.total_value?.value
    if (typeof v === 'number') values[key] = v
  }
  read(reach, 'reach')
  read(views, 'views')
  read(inter, 'interactions')
  read(prof, 'profile_views')

  if (fol?.error) error ??= fol.error.message
  else if (fol?.data?.[0]?.values) {
    values.new_followers = fol.data[0].values.reduce((s: number, v: { value: number }) => s + (v.value ?? 0), 0)
  }
  if (acct && typeof acct.followers_count === 'number') values.followers_total = acct.followers_count

  // Post de maior engajamento do mês
  const [y, m] = ym.split('-').map(Number)
  const start = Date.UTC(y, m - 1, 1, 3)
  const end = Date.UTC(y, m, 1, 3)
  let best: TopPost | null = null
  let bestScore = -1
  for (const p of media?.data ?? []) {
    const ts = new Date(String(p.timestamp).replace('+0000', 'Z')).getTime()
    if (ts < start || ts >= end) continue
    const score = (p.like_count ?? 0) + (p.comments_count ?? 0)
    if (score > bestScore) {
      bestScore = score
      best = {
        caption: String(p.caption ?? '').slice(0, 140),
        permalink: p.permalink,
        media_type: p.media_type,
        likes: p.like_count ?? 0,
        comments: p.comments_count ?? 0,
      }
    }
  }
  if (best) values.top_post = best

  return { values, error }
}

// ── Relatório do mês (automático + manual) ────────────────────────────────

const REFRESH_MS = 3 * 3600 * 1000

export async function getMonthReport(
  client: { id: string; instagram_account_id: string | null; facebook_page_token: string | null },
  ym: string,
): Promise<MonthReport> {
  const db = createServiceClient()
  const isCurrent = ym === currentMonth()

  const { data: row } = await db
    .from('monthly_reports')
    .select('overrides, snapshot, snapshot_at, note, highlight')
    .eq('client_id', client.id)
    .eq('month', ym)
    .maybeSingle()

  let snapshot: ReportValues = (row?.snapshot as ReportValues) ?? {}
  const snapshotAt = row?.snapshot_at ? new Date(row.snapshot_at).getTime() : 0
  const hasSnapshot = Object.keys(snapshot).length > 0

  // Mês corrente atualiza de tempos em tempos; mês passado só lê uma vez e fica guardado.
  const stale = isCurrent ? Date.now() - snapshotAt > REFRESH_MS : !hasSnapshot && !snapshotAt
  const token = process.env.FACEBOOK_SYSTEM_TOKEN ?? client.facebook_page_token ?? ''

  let igError: string | null = null
  if (stale && client.instagram_account_id && token) {
    const fresh = await fetchInstagram(client.instagram_account_id.trim(), token, ym, isCurrent)
    igError = fresh.error
    // seguidores totais só valem como foto do próprio mês; não sobrescreve depois que o mês acaba
    const merged: ReportValues = { ...snapshot, ...fresh.values }
    if (!isCurrent && snapshot.followers_total !== undefined) merged.followers_total = snapshot.followers_total
    snapshot = merged
    // Falha total da API não pode gravar "snapshot vazio feito": o mês passado nunca mais seria relido.
    if (!fresh.error || Object.keys(fresh.values).length > 0) {
      await db.from('monthly_reports').upsert(
        { client_id: client.id, month: ym, snapshot, snapshot_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { onConflict: 'client_id,month' },
      )
    }
  }

  const overrides: ReportValues = (row?.overrides as ReportValues) ?? {}
  const values: ReportValues = { ...snapshot }
  for (const [k, v] of Object.entries(overrides)) {
    if (v !== null && v !== undefined && v !== '') (values as Record<string, unknown>)[k] = v
  }

  return {
    month: ym,
    values,
    auto: snapshot,
    overrides,
    note: row?.note ?? '',
    highlight: row?.highlight ?? '',
    posts: await countPosts(client.id, ym),
    igError,
  }
}

// ── Próximas publicações e aprovações pendentes ───────────────────────────

export async function getUpcoming(clientId: string) {
  const db = createServiceClient()
  const today = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10)
  const [{ data: next }, { count: pending }] = await Promise.all([
    db.from('contents')
      .select('id, title, type, scheduled_date, scheduled_time, status')
      .eq('client_id', clientId)
      .gte('scheduled_date', today)
      .in('status', ['approved_by_client', 'sent_to_client', 'scheduled'])
      .order('scheduled_date', { ascending: true })
      .limit(6),
    db.from('contents')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('status', 'sent_to_client')
      .neq('type', 'story'),
  ])
  return { next: next ?? [], pending: pending ?? 0 }
}
