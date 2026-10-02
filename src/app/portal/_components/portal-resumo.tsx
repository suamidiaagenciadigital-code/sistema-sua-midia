import Link from 'next/link'
import { AD_FIELDS, GOOGLE_FIELDS, IG_FIELDS, type MonthReport, type NumKey } from '@/lib/portal-report'

function fmt(n: number): string {
  return n.toLocaleString('pt-BR')
}

function fmtMoney(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Custo médio por resultado (só aparece com investimento e resultado maiores que zero)
function perResult(spend: number | undefined, results: number | undefined, unit: string): string | undefined {
  if (!spend || !results) return undefined
  return `${fmtMoney(spend / results)} por ${unit}`
}

function Delta({ cur, prev }: { cur?: number; prev?: number }) {
  if (cur === undefined || prev === undefined || prev === 0) return null
  const diff = Math.round(((cur - prev) / prev) * 100)
  const up = diff >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${
        up ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50' : 'text-red-400 bg-red-950/60 border-red-800/50'
      }`}
    >
      {up ? '▲' : '▼'} {Math.abs(diff)}%
    </span>
  )
}

function Card({ label, value, cur, prev, sub }: { label: string; value: string; cur?: number; prev?: number; sub?: string }) {
  return (
    <div className="bg-[#131b2e] rounded-2xl border border-slate-800 px-5 py-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</span>
        <Delta cur={cur} prev={prev} />
      </div>
      <p className="text-white text-3xl font-bold leading-none">{value}</p>
      {sub && <p className="text-slate-500 text-xs">{sub}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-white text-sm font-semibold uppercase tracking-wide text-slate-300">{title}</h2>
      {children}
    </section>
  )
}

const TYPE_LABEL: Record<string, string> = { imagem: 'Imagem', carrossel: 'Carrossel', reel: 'Reel', story: 'Story' }
const STATUS_LABEL: Record<string, string> = {
  approved_by_client: 'Aprovada',
  sent_to_client: 'Aguardando sua aprovação',
  scheduled: 'Agendada',
}

function fmtDate(d: string): string {
  return new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

interface Props {
  cur: MonthReport
  prev: MonthReport
  curLabel: string
  prevLabel: string
  upcoming: { id: string; title: string; type: string; scheduled_date: string; scheduled_time: string | null; status: string }[]
  pendingApprovals: number
  approvalToken: string | null
  hasInstagram: boolean
}

export default function PortalResumo({ cur, prev, curLabel, prevLabel, upcoming, pendingApprovals, approvalToken, hasInstagram }: Props) {
  const hasAds = AD_FIELDS.some((f) => cur.values[f.key] !== undefined)
  const hasGoogle = GOOGLE_FIELDS.some((f) => cur.values[f.key] !== undefined)
  const igCards = IG_FIELDS.filter((f) => cur.values[f.key] !== undefined)

  return (
    <div className="space-y-8">
      {pendingApprovals > 0 && approvalToken && (
        <Link
          href={`/approve/${approvalToken}`}
          className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 hover:bg-amber-500/15 transition-colors"
        >
          <span className="text-amber-200 text-sm font-medium">
            Você tem {pendingApprovals} publicação{pendingApprovals > 1 ? 'ões' : ''} aguardando aprovação
          </span>
          <span className="text-amber-300 text-sm font-semibold shrink-0">Revisar →</span>
        </Link>
      )}

      <Section title="Publicações">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card label="Publicadas no mês" value={fmt(cur.posts.published)} cur={cur.posts.published} prev={prev.posts.published} sub={`${prevLabel}: ${fmt(prev.posts.published)}`} />
          <Card label="Feed" value={fmt(cur.posts.feed)} cur={cur.posts.feed} prev={prev.posts.feed} sub={`${cur.posts.images} imagem · ${cur.posts.carousels} carrossel · ${cur.posts.reels} reel`} />
          <Card label="Stories" value={fmt(cur.posts.stories)} cur={cur.posts.stories} prev={prev.posts.stories} />
          <Card label="Ainda a publicar" value={fmt(cur.posts.upcoming)} sub="Aprovadas ou agendadas neste mês" />
        </div>
      </Section>

      <Section title="Resultados do Instagram">
        {igCards.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {igCards.map((f) => (
              <Card
                key={f.key}
                label={f.label}
                value={fmt(cur.values[f.key as NumKey] as number)}
                cur={cur.values[f.key as NumKey]}
                prev={prev.values[f.key as NumKey]}
                sub={f.key === 'followers_total' ? undefined : f.hint || undefined}
              />
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm bg-[#131b2e] rounded-2xl border border-slate-800 px-5 py-4">
            {hasInstagram ? 'Os números de ' + curLabel + ' ainda não estão disponíveis.' : 'Instagram ainda não conectado.'}
          </p>
        )}
      </Section>

      {hasAds && (
        <Section title="Anúncios no Instagram e Facebook">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {cur.values.ads_spend !== undefined && <Card label="Investido" value={fmtMoney(cur.values.ads_spend)} cur={cur.values.ads_spend} prev={prev.values.ads_spend} />}
            {cur.values.ads_reach !== undefined && <Card label="Alcance" value={fmt(cur.values.ads_reach)} cur={cur.values.ads_reach} prev={prev.values.ads_reach} />}
            {cur.values.ads_whatsapp !== undefined && (
              <Card
                label="Conversas no WhatsApp"
                value={fmt(cur.values.ads_whatsapp)}
                cur={cur.values.ads_whatsapp}
                prev={prev.values.ads_whatsapp}
                sub={perResult(cur.values.ads_spend, cur.values.ads_whatsapp, 'conversa')}
              />
            )}
            {cur.values.ads_site_clicks !== undefined && (
              <Card
                label="Cliques no site"
                value={fmt(cur.values.ads_site_clicks)}
                cur={cur.values.ads_site_clicks}
                prev={prev.values.ads_site_clicks}
                sub={perResult(cur.values.ads_spend, cur.values.ads_site_clicks, 'clique')}
              />
            )}
          </div>
        </Section>
      )}

      {hasGoogle && (
        <Section title="Anúncios no Google">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {cur.values.google_spend !== undefined && <Card label="Investido" value={fmtMoney(cur.values.google_spend)} cur={cur.values.google_spend} prev={prev.values.google_spend} />}
            {cur.values.google_clicks !== undefined && (
              <Card
                label="Cliques no anúncio"
                value={fmt(cur.values.google_clicks)}
                cur={cur.values.google_clicks}
                prev={prev.values.google_clicks}
                sub={perResult(cur.values.google_spend, cur.values.google_clicks, 'clique')}
              />
            )}
            {cur.values.google_whatsapp !== undefined && (
              <Card
                label="Conversas no WhatsApp"
                value={fmt(cur.values.google_whatsapp)}
                cur={cur.values.google_whatsapp}
                prev={prev.values.google_whatsapp}
                sub={perResult(cur.values.google_spend, cur.values.google_whatsapp, 'conversa')}
              />
            )}
          </div>
        </Section>
      )}

      <Section title="Próximas publicações">
        {upcoming.length === 0 ? (
          <p className="text-slate-500 text-sm bg-[#131b2e] rounded-2xl border border-slate-800 px-5 py-4">Nenhuma publicação agendada no momento.</p>
        ) : (
          <div className="bg-[#131b2e] rounded-2xl border border-slate-800 divide-y divide-slate-800">
            {upcoming.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{c.title}</p>
                  <p className="text-slate-500 text-xs">
                    {TYPE_LABEL[c.type] ?? c.type} · {fmtDate(c.scheduled_date)}
                    {c.scheduled_time ? ` às ${c.scheduled_time.slice(0, 5)}` : ''}
                  </p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{STATUS_LABEL[c.status] ?? c.status}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <p className="text-slate-600 text-xs">Comparações em relação a {prevLabel}. Dados de {curLabel}.</p>
    </div>
  )
}
