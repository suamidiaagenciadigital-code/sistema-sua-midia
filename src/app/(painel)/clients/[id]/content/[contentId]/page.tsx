import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, CalendarDays, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { STATUS_LABEL, TYPE_LABEL, ContentStatus } from '@/lib/content-status'
import { deleteContentAction } from './actions'
import { ContentStatusActions } from './content-actions-client'
import { ContentEditForm } from './content-edit-form'

interface Props {
  params: Promise<{ id: string; contentId: string }>
}

const STATUS_BADGE_STYLE: Record<ContentStatus, React.CSSProperties> = {
  draft:               { backgroundColor: '#1e293b',              color: '#64748b' },
  pending_my_approval: { backgroundColor: 'rgba(161,98,7,0.3)',   color: '#fbbf24' },
  approved_by_me:      { backgroundColor: 'rgba(29,78,216,0.3)',  color: '#60a5fa' },
  sent_to_client:      { backgroundColor: 'rgba(154,52,18,0.3)',  color: '#fb923c' },
  approved_by_client:  { backgroundColor: 'rgba(20,83,45,0.3)',   color: '#4ade80' },
  published:           { backgroundColor: 'rgba(6,78,59,0.5)',    color: '#34d399' },
  revision:            { backgroundColor: 'rgba(127,29,29,0.3)',  color: '#f87171' },
  scheduled:           { backgroundColor: 'rgba(88,28,135,0.3)',  color: '#c084fc' },
}

const TYPE_ICON_MAP: Record<string, string> = {
  reel: '🎬', carrossel: '🗂️', imagem: '🖼', story: '📲',
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

  const del = deleteContentAction.bind(null, id, contentId)

  const status = content.status as ContentStatus
  const isPublished = status === 'published'

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href={`/clients/${id}/calendar`}
            className="flex items-center justify-center w-8 h-8 rounded-lg mt-1 shrink-0 transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <ChevronLeft className="h-4 w-4 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white leading-tight">{content.title}</h1>
            <p className="text-slate-500 text-sm mt-1">
              {client?.name}
              <span className="mx-1.5">·</span>
              {TYPE_ICON_MAP[content.type]} {TYPE_LABEL[content.type]}
              {content.scheduled_date && (
                <>
                  <span className="mx-1.5">·</span>
                  {new Date(content.scheduled_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <span
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold shrink-0 mt-1"
          style={STATUS_BADGE_STYLE[status]}
        >
          {isPublished && <CheckCircle2 className="h-3.5 w-3.5" />}
          {STATUS_LABEL[status]}
        </span>
      </div>

      {/* Fluxo de aprovação (collapsible, client component) */}
      <ContentStatusActions clientId={id} contentId={contentId} currentStatus={content.status} contentType={content.type} />

      {/* Notas de revisão do cliente */}
      {content.revision_notes && (
        <div
          className="rounded-xl px-5 py-4 flex gap-3"
          style={{
            backgroundColor: 'rgba(217,119,6,0.1)',
            border: '1px solid rgba(217,119,6,0.25)',
          }}
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: '#fbbf24' }}>Notas de revisão</p>
            <p className="text-sm text-slate-300">{content.revision_notes}</p>
            {content.revision_count > 0 && (
              <p className="text-xs text-slate-600 mt-1.5">
                {content.revision_count} revisão{content.revision_count > 1 ? 'ões' : ''} solicitada{content.revision_count > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Edição do conteúdo */}
      <ContentEditForm clientId={id} clientName={client?.name ?? ''} contentId={contentId} content={content} />

      {/* Ver no calendário */}
      <div
        className="rounded-xl px-5 py-3 flex items-center gap-2"
        style={{ backgroundColor: '#131b2e', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <CalendarDays className="h-4 w-4" style={{ color: '#2B80FF' }} />
        <Link
          href={`/clients/${id}/calendar`}
          className="text-sm font-medium transition-colors hover:text-white"
          style={{ color: '#2B80FF' }}
        >
          Ver no calendário
        </Link>
      </div>

      {/* Zona de perigo */}
      <div
        className="rounded-xl px-5 py-4 flex items-center justify-between"
        style={{
          backgroundColor: 'rgba(127,29,29,0.15)',
          border: '1px solid rgba(239,68,68,0.2)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: '#f87171' }} />
          <span className="text-sm font-semibold" style={{ color: '#f87171' }}>Zona de perigo</span>
        </div>
        <form action={del}>
          <button
            type="submit"
            className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
            style={{
              border: '1px solid rgba(239,68,68,0.4)',
              backgroundColor: 'rgba(239,68,68,0.08)',
              color: '#f87171',
            }}
          >
            Excluir conteúdo
          </button>
        </form>
      </div>
    </div>
  )
}
