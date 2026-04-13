import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, CalendarDays } from 'lucide-react'
import { STATUS_COLOR, STATUS_LABEL, TYPE_ICON, TYPE_LABEL, ContentStatus } from '@/lib/content-status'
import { updateContentAction, deleteContentAction } from './actions'
import { ContentStatusActions } from './content-actions-client'

interface Props {
  params: Promise<{ id: string; contentId: string }>
}

export default async function ContentDetailPage({ params }: Props) {
  const { id, contentId } = await params
  const supabase = await createClient()

  const { data: content } = await supabase
    .from('contents')
    .select('*')
    .eq('id', contentId)
    .eq('client_id', id)
    .single()

  if (!content) notFound()

  const { data: client } = await supabase.from('clients').select('name').eq('id', id).single()

  const update = updateContentAction.bind(null, id, contentId)
  const del = deleteContentAction.bind(null, id, contentId)

  const base = "w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/clients/${id}/calendar`} className="text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{TYPE_ICON[content.type]}</span>
              <h1 className="text-2xl font-bold text-white">{content.title}</h1>
            </div>
            <p className="text-zinc-400 text-sm mt-0.5">
              {client?.name} · {TYPE_LABEL[content.type]}
              {content.scheduled_date && ` · ${new Date(content.scheduled_date + 'T12:00:00').toLocaleDateString('pt-BR')}`}
            </p>
          </div>
        </div>
        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${STATUS_COLOR[content.status as ContentStatus]}`}>
          {STATUS_LABEL[content.status as ContentStatus]}
        </span>
      </div>

      {/* Ações de status */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white">Fluxo de aprovação</h2>
        <ContentStatusActions clientId={id} contentId={contentId} currentStatus={content.status} />
        {content.revision_notes && (
          <div className="rounded-md border border-orange-900/50 bg-orange-950/20 p-3 mt-2">
            <p className="text-xs font-medium text-orange-400 mb-1">Notas de revisão</p>
            <p className="text-sm text-zinc-300">{content.revision_notes}</p>
          </div>
        )}
        {content.revision_count > 0 && (
          <p className="text-xs text-zinc-500">{content.revision_count} revisão{content.revision_count > 1 ? 'ões' : ''} solicitada{content.revision_count > 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Edição do conteúdo */}
      <form action={update} className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Conteúdo</h2>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Título / Tema</label>
          <input type="text" name="title" defaultValue={content.title} className={base} />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Copy / Legenda</label>
          <textarea name="caption" rows={6} defaultValue={content.caption ?? ''} className={base} />
        </div>

        {(content.type === 'reel' || content.type === 'carrossel') && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Roteiro / Estrutura de slides</label>
            <textarea name="script" rows={8} defaultValue={content.script ?? ''} className={base} />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Prompt de imagem</label>
          <textarea name="image_prompt" rows={3} defaultValue={content.image_prompt ?? ''} className={base} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">CTA</label>
            <input type="text" name="cta" defaultValue={content.cta ?? ''} className={base} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Parceiro mencionado</label>
            <input type="text" name="partner_mentioned" defaultValue={content.partner_mentioned ?? ''} className={base} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Data de publicação</label>
            <input type="date" name="scheduled_date" defaultValue={content.scheduled_date ?? ''} className={base} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Notas de revisão</label>
          <textarea name="revision_notes" rows={2} defaultValue={content.revision_notes ?? ''} className={base} />
        </div>

        <button type="submit"
          className="rounded-md bg-white px-5 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors">
          Salvar alterações
        </button>
      </form>

      {/* Links rápidos */}
      <div className="flex gap-3">
        <Link
          href={`/clients/${id}/calendar`}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <CalendarDays className="h-4 w-4" />
          Ver no calendário
        </Link>
      </div>

      {/* Excluir */}
      <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-red-400">Zona de perigo</h3>
        <form action={del} onSubmit={undefined}>
          <button type="submit"
            className="rounded-md border border-red-800 px-4 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/30 transition-colors">
            Excluir conteúdo
          </button>
        </form>
      </div>
    </div>
  )
}
