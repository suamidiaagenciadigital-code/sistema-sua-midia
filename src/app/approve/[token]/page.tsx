import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TYPE_ICON, TYPE_LABEL } from '@/lib/content-status'
import ApprovalActions from './approval-actions'

interface Props {
  params: Promise<{ token: string }>
}

export default async function PublicApprovalPage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  // Buscar cliente pelo token
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, niche')
    .eq('approval_token', token)
    .single()

  if (!client) notFound()

  // Buscar conteúdos enviados ao cliente (sem RLS especial — usamos service role via server)
  const { data: contents } = await supabase
    .from('contents')
    .select('id, title, type, caption, script, cta, scheduled_date, status, revision_notes')
    .eq('client_id', client.id)
    .eq('status', 'sent_to_client')
    .order('scheduled_date', { ascending: true })

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <p className="text-zinc-500 text-sm">Aprovação de conteúdo</p>
          <h1 className="text-3xl font-bold text-white">{client.name}</h1>
          <p className="text-zinc-400 text-sm">{client.niche}</p>
        </div>

        {!contents?.length ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center space-y-2">
            <p className="text-white font-medium">Nenhum conteúdo aguardando aprovação</p>
            <p className="text-zinc-500 text-sm">A agência ainda não enviou conteúdos para esta semana.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-zinc-400 text-sm">
              {contents.length} conteúdo{contents.length > 1 ? 's' : ''} aguardando sua aprovação.
              Revise e aprove ou solicite alterações.
            </p>

            {contents.map(c => (
              <div key={c.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
                {/* Cabeçalho do card */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{TYPE_ICON[c.type]}</span>
                    <div>
                      <p className="text-white font-semibold">{c.title}</p>
                      <p className="text-xs text-zinc-500">
                        {TYPE_LABEL[c.type]}
                        {c.scheduled_date && ` · ${new Date(c.scheduled_date + 'T12:00:00').toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Copy/legenda */}
                {c.caption && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Legenda</p>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{c.caption}</p>
                  </div>
                )}

                {/* Roteiro */}
                {c.script && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      {c.type === 'carrossel' ? 'Estrutura dos slides' : 'Roteiro'}
                    </p>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap bg-zinc-800 rounded-md p-3">{c.script}</p>
                  </div>
                )}

                {/* CTA */}
                {c.cta && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">CTA</p>
                    <p className="text-sm text-zinc-300">{c.cta}</p>
                  </div>
                )}

                {/* Ações */}
                <ApprovalActions contentId={c.id} token={token} />
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-zinc-600">
          Link de aprovação exclusivo para {client.name} · Agência Sua Mídia
        </p>
      </div>
    </div>
  )
}
