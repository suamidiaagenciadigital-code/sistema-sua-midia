import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft } from 'lucide-react'
import { updateCampaignStatusAction, deleteCampaignAction } from './actions'
import { SubmitButton } from '../../_components/submit-button'

const statusLabel: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativa',
  paused: 'Pausada',
  completed: 'Encerrada',
}

const statusColor: Record<string, string> = {
  draft: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  active: 'bg-green-900/30 text-green-300 border-green-800',
  paused: 'bg-yellow-900/30 text-yellow-300 border-yellow-800',
  completed: 'bg-zinc-800 text-zinc-500 border-zinc-700',
}

interface Props {
  params: Promise<{ campaignId: string }>
}

export default async function CampaignDetailPage({ params }: Props) {
  const { campaignId } = await params
  const supabase = await createClient()

  const { data: campaign } = await supabase
    .from('ad_campaigns')
    .select('*, clients(name)')
    .eq('id', campaignId)
    .single()

  if (!campaign) notFound()

  const copies = campaign.copies as { label: string; headline: string; body: string; cta: string }[] | null

  const activate = updateCampaignStatusAction.bind(null, campaignId, 'active')
  const pause = updateCampaignStatusAction.bind(null, campaignId, 'paused')
  const complete = updateCampaignStatusAction.bind(null, campaignId, 'completed')
  const del = deleteCampaignAction.bind(null, campaignId)

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/ads" className="text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{(campaign.clients as any)?.name ?? '—'}</h1>
            <p className="text-zinc-400 text-sm mt-0.5">
              {campaign.budget && `${campaign.budget} · `}
              {campaign.period && `${campaign.period} · `}
              {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded border ${statusColor[campaign.status]}`}>
          {statusLabel[campaign.status]}
        </span>
      </div>

      {/* Objetivo */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-2">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Objetivo</p>
        <p className="text-sm text-zinc-200">{campaign.objective}</p>
      </div>

      {/* Estratégia */}
      {campaign.strategy && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Estratégia</p>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{campaign.strategy}</p>
        </div>
      )}

      {/* Copies */}
      {copies && copies.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Copies (A/B)</p>
          {copies.map((copy, i) => (
            <div key={i} className="border border-zinc-800 rounded-md p-4 space-y-2">
              <p className="text-xs font-semibold text-zinc-400">{copy.label}</p>
              <p className="text-sm font-medium text-white">{copy.headline}</p>
              <p className="text-sm text-zinc-300">{copy.body}</p>
              <p className="text-xs text-zinc-500">CTA: {copy.cta}</p>
            </div>
          ))}
        </div>
      )}

      {/* Público */}
      {campaign.audience_suggestion && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Sugestão de público</p>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{campaign.audience_suggestion}</p>
        </div>
      )}

      {/* Ações de status */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-3">
        <p className="text-sm font-semibold text-white">Status da campanha</p>
        <div className="flex flex-wrap gap-2">
          {campaign.status !== 'active' && (
            <form action={activate}>
              <SubmitButton className="rounded-md bg-green-900/40 border border-green-800 px-4 py-1.5 text-xs font-medium text-green-300 hover:bg-green-900/60" loadingText="Ativando..." savedText="Ativa!">
                Marcar como ativa
              </SubmitButton>
            </form>
          )}
          {campaign.status === 'active' && (
            <form action={pause}>
              <SubmitButton className="rounded-md bg-yellow-900/40 border border-yellow-800 px-4 py-1.5 text-xs font-medium text-yellow-300 hover:bg-yellow-900/60" loadingText="Pausando..." savedText="Pausada!">
                Pausar campanha
              </SubmitButton>
            </form>
          )}
          {campaign.status !== 'completed' && (
            <form action={complete}>
              <SubmitButton className="rounded-md border border-zinc-700 px-4 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:border-zinc-500" loadingText="Encerrando..." savedText="Encerrada!">
                Encerrar campanha
              </SubmitButton>
            </form>
          )}
        </div>
      </div>

      {/* Excluir */}
      <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-red-400">Zona de perigo</h3>
        <form action={del}>
          <button type="submit" className="rounded-md border border-red-800 px-4 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/30 transition-colors">
            Excluir campanha
          </button>
        </form>
      </div>
    </div>
  )
}
