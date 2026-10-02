import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
  AD_FIELDS, IG_FIELDS, currentMonth, getMonthReport, isValidMonth, monthLabel, shiftMonth, type NumKey,
} from '@/lib/portal-report'
import { saveReportAction } from './actions'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ month?: string }>
}

const input = 'w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500'

export default async function RelatorioPage({ params, searchParams }: Props) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, instagram_account_id, facebook_page_token')
    .eq('id', id)
    .single()
  if (!client) notFound()

  const month = isValidMonth(sp.month) ? sp.month : currentMonth()
  const report = await getMonthReport(client, month)
  const save = saveReportAction.bind(null, id, month)

  const numRow = (f: { key: NumKey; label: string; hint: string }, money = false) => {
    const auto = report.auto[f.key]
    const manual = report.overrides[f.key]
    const using = manual !== undefined ? manual : auto
    return (
      <div key={f.key} className="grid grid-cols-[1fr_7rem_8rem] items-center gap-3 py-2 border-b border-zinc-800 last:border-0">
        <div>
          <p className="text-sm text-white">{f.label}</p>
          {f.hint && <p className="text-xs text-zinc-500">{f.hint}</p>}
        </div>
        <p className="text-sm text-zinc-400 text-right">{auto !== undefined ? auto.toLocaleString('pt-BR') : '—'}</p>
        <input
          name={`ov_${f.key}`}
          defaultValue={manual !== undefined ? String(manual).replace('.', ',') : ''}
          placeholder={using !== undefined ? 'usar automático' : money ? '0,00' : '0'}
          inputMode="decimal"
          className={input}
        />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/clients/${id}`} className="text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Resumo do portal</h1>
          <p className="text-zinc-400 text-sm mt-0.5">{client.name} · números que o cliente vê</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Link href={`/clients/${id}/relatorio?month=${shiftMonth(month, -1)}`} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:text-white">←</Link>
          <span className="text-white font-semibold text-sm w-36 text-center">{monthLabel(month)}</span>
          <Link href={`/clients/${id}/relatorio?month=${shiftMonth(month, 1)}`} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:text-white">→</Link>
        </div>
        <a
          href={`/portal/metricas?cliente=${id}&month=${month}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          Ver como o cliente →
        </a>
      </div>

      {report.igError && (
        <p className="text-xs text-amber-400 bg-amber-950/30 border border-amber-800/40 rounded-lg px-3 py-2">
          O Instagram não devolveu todos os números ({report.igError}). Você pode preencher manualmente abaixo.
        </p>
      )}

      <form action={save} className="space-y-6">
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Instagram</h2>
          <p className="text-xs text-zinc-500 mb-3">Deixe o campo vazio para usar o número automático. O que você digitar vale no lugar dele.</p>
          <div className="grid grid-cols-[1fr_7rem_8rem] gap-3 pb-1 text-[11px] uppercase tracking-wide text-zinc-500">
            <span />
            <span className="text-right">Automático</span>
            <span>Manual</span>
          </div>
          {IG_FIELDS.map((f) => numRow(f))}
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Anúncios</h2>
          <p className="text-xs text-zinc-500 mb-3">Sem leitura automática. Preencha o que se aplica: campanha de mensagem usa “Conversas no WhatsApp”, campanha de tráfego usa “Cliques no link”. Campo vazio não aparece pro cliente.</p>
          {AD_FIELDS.map((f) => numRow(f, f.key === 'ads_spend'))}
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white">Recado da agência</h2>
          <input name="highlight" defaultValue={report.highlight} placeholder="Título do destaque (opcional)" className={input} />
          <textarea name="note" defaultValue={report.note} rows={4} placeholder="O que fizemos, o que funcionou, próximos passos…" className={input} />
        </section>

        <button type="submit" className="rounded-full px-6 py-2.5 text-sm font-bold text-white" style={{ background: 'linear-gradient(to right, #2B80FF, #A855F7)' }}>
          Salvar
        </button>
      </form>
    </div>
  )
}
