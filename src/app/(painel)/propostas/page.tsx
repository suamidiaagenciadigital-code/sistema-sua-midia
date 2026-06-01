import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ExternalLink, Eye, FileText } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://sistema.suamidia.com.br')

export default async function PropostasPage() {
  const supabase = createServiceClient()

  const { data: proposals } = await supabase
    .from('proposals')
    .select('id, slug, client_name, service_title, monthly_value, status, views, valid_days, created_at')
    .order('created_at', { ascending: false })

  const statusLabel: Record<string, string> = { active: 'Ativa', expired: 'Expirada', closed: 'Encerrada' }
  const statusColor: Record<string, string> = {
    active: 'text-green-400 bg-green-950/50 border-green-800/50',
    expired: 'text-yellow-400 bg-yellow-950/50 border-yellow-800/50',
    closed: 'text-zinc-500 bg-zinc-800/50 border-zinc-700',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold">Propostas</h1>
          <p className="text-zinc-400 text-sm mt-1">Propostas comerciais geradas para clientes</p>
        </div>
        <Link
          href="/propostas/nova"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium"
          style={{ background: 'linear-gradient(to right, #2B80FF, #A855F7)' }}
        >
          <Plus className="h-4 w-4" /> Nova proposta
        </Link>
      </div>

      {(!proposals || proposals.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <FileText className="h-12 w-12 text-zinc-700" />
          <p className="text-white font-medium">Nenhuma proposta ainda</p>
          <p className="text-zinc-500 text-sm">Crie sua primeira proposta comercial profissional.</p>
          <Link href="/propostas/nova" className="mt-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: 'linear-gradient(to right, #2B80FF, #A855F7)' }}>
            Criar proposta
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map(p => (
            <div key={p.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-5 py-4 flex items-center justify-between gap-4 hover:border-zinc-700 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-0.5">
                  <p className="text-white font-medium text-sm">{p.client_name}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor[p.status] ?? statusColor.active}`}>
                    {statusLabel[p.status] ?? 'Ativa'}
                  </span>
                </div>
                <p className="text-zinc-500 text-xs truncate">{p.service_title} · {Number(p.monthly_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês</p>
              </div>

              <div className="flex items-center gap-3 text-zinc-600 text-xs flex-shrink-0">
                <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{p.views ?? 0}</span>
                <span>{new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <a
                  href={`${BASE_URL}/propostas/${p.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white text-xs transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Ver
                </a>
                <Link
                  href={`/propostas/preview/${p.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white text-xs transition-colors"
                >
                  Gerenciar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
