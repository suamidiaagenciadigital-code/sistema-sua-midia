import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ExternalLink, Download, ArrowLeft, Eye } from 'lucide-react'
import Link from 'next/link'
import { deleteProposalAction, updateProposalStatusAction } from '../../nova/actions'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://sistema.suamidia.com.br')

interface Props { params: Promise<{ id: string }> }

export default async function PropostaPreviewPage({ params }: Props) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: p } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', id)
    .single()

  if (!p) notFound()

  const onlineUrl = `${BASE_URL}/propostas/${p.slug}`
  const downloadUrl = `${onlineUrl}?download=1`
  const fmtValue = Number(p.monthly_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const statusColor: Record<string, string> = {
    active: 'text-green-400 bg-green-950/50 border-green-800/50',
    expired: 'text-yellow-400 bg-yellow-950/50 border-yellow-800/50',
    closed: 'text-zinc-400 bg-zinc-800/50 border-zinc-700',
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/propostas" className="text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-white text-2xl font-bold">{p.client_name}</h1>
          <p className="text-zinc-400 text-sm mt-0.5">{p.service_title}</p>
        </div>
        <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full border ${statusColor[p.status] ?? statusColor.active}`}>
          {p.status === 'active' ? '● Ativa' : p.status === 'expired' ? '● Expirada' : '● Encerrada'}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Valor mensal', value: fmtValue },
          { label: 'Validade', value: `${p.valid_days} dias` },
          { label: 'Visualizações', value: String(p.views ?? 0) },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-white text-xl font-bold">{s.value}</p>
            <p className="text-zinc-500 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Link */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4 space-y-3">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Link da proposta</p>
        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5">
          <span className="text-zinc-300 text-sm flex-1 truncate">{onlineUrl}</span>
          <button
            onClick={() => navigator.clipboard?.writeText(onlineUrl)}
            className="text-xs text-blue-400 hover:text-blue-300 flex-shrink-0"
          >
            Copiar
          </button>
        </div>
        <div className="flex gap-2">
          <a
            href={onlineUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white text-sm transition-colors"
          >
            <ExternalLink className="h-4 w-4" /> Ver online
          </a>
          <a
            href={downloadUrl}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white text-sm transition-colors"
          >
            <Download className="h-4 w-4" /> Baixar HTML
          </a>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href={`/propostas/nova`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white transition-colors"
        >
          Nova proposta
        </Link>

        <form action={async () => {
          'use server'
          await updateProposalStatusAction(id, p.status === 'active' ? 'closed' : 'active')
        }}>
          <button type="submit" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white transition-colors">
            {p.status === 'active' ? 'Encerrar proposta' : 'Reativar proposta'}
          </button>
        </form>

        <form action={async () => {
          'use server'
          await deleteProposalAction(id)
        }}>
          <button type="submit" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm border border-red-900/50 text-red-400 hover:text-red-300 hover:border-red-700 transition-colors">
            Excluir
          </button>
        </form>
      </div>
    </div>
  )
}
