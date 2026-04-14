import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TYPE_LABEL } from '@/lib/content-status'
import ApprovalActions from './approval-actions'

interface Props {
  params: Promise<{ token: string }>
}

const TYPE_EMOJI: Record<string, string> = {
  feed: '📷',
  reel: '🎬',
  story: '📲',
  carrossel: '🗂️',
}

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

export default async function PublicApprovalPage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, niche')
    .eq('approval_token', token)
    .single()

  if (!client) notFound()

  const { data: contents } = await supabase
    .from('contents')
    .select('id, title, type, caption, script, cta, scheduled_date, status, revision_notes, generated_image_url, media_urls')
    .eq('client_id', client.id)
    .eq('status', 'sent_to_client')
    .order('scheduled_date', { ascending: true })

  const initials = client.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-black">
      {/* Header estilo Instagram */}
      <div className="sticky top-0 z-10 bg-black border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
          <span className="text-white font-semibold text-sm">{client.name}</span>
        </div>
        <span className="text-zinc-500 text-xs">aprovação de conteúdo</span>
      </div>

      {/* Feed */}
      <div className="max-w-[468px] mx-auto pb-12">
        {!contents?.length ? (
          <div className="flex flex-col items-center justify-center py-24 px-8 text-center space-y-3">
            <div className="text-4xl">✅</div>
            <p className="text-white font-semibold">Tudo certo por aqui!</p>
            <p className="text-zinc-500 text-sm">Nenhum conteúdo aguardando aprovação no momento.</p>
          </div>
        ) : (
          <>
            {/* Contador */}
            <div className="px-4 py-3 border-b border-zinc-800">
              <p className="text-zinc-400 text-sm">
                <span className="text-white font-medium">{contents.length}</span> publicação{contents.length > 1 ? 'ões' : ''} aguardando sua aprovação
              </p>
            </div>

            {contents.map((c, i) => {
              const mediaUrl = c.generated_image_url ?? c.media_urls?.[0] ?? null
              const isVideo = mediaUrl && /\.(mp4|mov|avi|webm)(\?|$)/i.test(mediaUrl)

              return (
                <article key={c.id} className={`border-b border-zinc-800 ${i > 0 ? 'mt-2' : ''}`}>
                  {/* Post header */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold leading-tight">{client.name}</p>
                        <p className="text-zinc-500 text-xs">{TYPE_EMOJI[c.type] || '📄'} {TYPE_LABEL[c.type]}</p>
                      </div>
                    </div>
                    {c.scheduled_date && (
                      <span className="text-zinc-500 text-xs">{formatDate(c.scheduled_date)}</span>
                    )}
                  </div>

                  {/* Criativo */}
                  {mediaUrl ? (
                    <div className="w-full bg-zinc-900 aspect-square">
                      {isVideo ? (
                        <video
                          src={mediaUrl}
                          controls
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mediaUrl}
                          alt={c.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-full aspect-square bg-zinc-900 flex flex-col items-center justify-center gap-2">
                      <span className="text-5xl">{TYPE_EMOJI[c.type] || '📄'}</span>
                      <p className="text-zinc-600 text-xs">Criativo não anexado</p>
                    </div>
                  )}

                  {/* Caption */}
                  <div className="px-4 pt-3 pb-1 space-y-1">
                    <p className="text-sm text-white leading-relaxed">
                      <span className="font-semibold">{client.name} </span>
                      <span className="text-zinc-300 whitespace-pre-wrap">{c.caption}</span>
                    </p>
                    {c.title && c.title !== c.caption && (
                      <p className="text-zinc-500 text-xs font-medium">{c.title}</p>
                    )}
                  </div>

                  {/* Roteiro (se houver) */}
                  {c.script && (
                    <div className="px-4 py-2">
                      <details className="group">
                        <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors list-none flex items-center gap-1">
                          <span>Ver {c.type === 'carrossel' ? 'estrutura dos slides' : 'roteiro'}</span>
                          <span className="group-open:rotate-180 transition-transform inline-block">▾</span>
                        </summary>
                        <p className="mt-2 text-sm text-zinc-400 whitespace-pre-wrap bg-zinc-900 rounded-lg p-3">{c.script}</p>
                      </details>
                    </div>
                  )}

                  {/* Ações de aprovação */}
                  <div className="px-4 pb-4 pt-2">
                    <ApprovalActions contentId={c.id} token={token} />
                  </div>
                </article>
              )
            })}
          </>
        )}
      </div>

      <footer className="text-center pb-8">
        <p className="text-zinc-700 text-xs">Agência Sua Mídia · aprovação exclusiva para {client.name}</p>
      </footer>
    </div>
  )
}
