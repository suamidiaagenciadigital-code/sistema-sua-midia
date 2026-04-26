import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { TYPE_LABEL } from '@/lib/content-status'
import ApprovalActions from './approval-actions'
import { MediaCarousel } from './media-carousel'
import { CopyCaptionButton } from './copy-caption-button'
import { WhatsAppShareButton } from './whatsapp-share-button'

interface Props {
  params: Promise<{ token: string }>
}

// Converte Google Drive para URL direta (imagem)
function resolveImageUrl(url: string | null): string | null {
  if (!url) return null
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)
  if (driveMatch) return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`
  return url
}

// Extrai FILE_ID do Drive para embed de vídeo
function getDriveEmbedUrl(url: string | null): string | null {
  if (!url) return null
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)
  if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`
  return url
}

// Gera URL de download para Google Drive ou URL direta
function getDownloadUrl(url: string | null): string | null {
  if (!url) return null
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)
  if (driveMatch) return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`
  return url
}

function DownloadButton({ urls, label }: { urls: string[]; label?: string }) {
  if (urls.length === 0) return null
  if (urls.length === 1) {
    const dl = getDownloadUrl(urls[0])
    if (!dl) return null
    return (
      <a
        href={dl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-sm transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {label ?? 'Baixar arquivo'}
      </a>
    )
  }
  // Carrossel: link para cada slide
  return (
    <div className="space-y-1">
      <p className="text-xs text-zinc-500 text-center mb-2">Baixar slides</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {urls.map((url, i) => {
          const dl = getDownloadUrl(url)
          if (!dl) return null
          return (
            <a
              key={i}
              href={dl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-xs transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Slide {i + 1}
            </a>
          )
        })}
      </div>
    </div>
  )
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
  const supabase = createServiceClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, niche')
    .eq('approval_token', token)
    .single()

  if (!client) notFound()

  const { data: contents } = await supabase
    .from('contents')
    .select('id, title, type, caption, script, cta, scheduled_date, created_at, status, revision_notes, generated_image_url, media_urls')
    .eq('client_id', client.id)
    .in('status', ['sent_to_client', 'approved_by_client', 'published'])
    .order('created_at', { ascending: false })

  // Stories não aparecem na página de aprovação (gerenciados internamente)
  // Pendentes: mais recente primeiro (created_at DESC já vem da query)
  const pending  = (contents ?? []).filter(c => c.status === 'sent_to_client' && c.type !== 'story')
  // Aprovados: ordem cronológica por data agendada (mais antigo primeiro)
  const approved = (contents ?? [])
    .filter(c => (c.status === 'approved_by_client' || c.status === 'published') && c.type !== 'story')
    .sort((a, b) => {
      const da = a.scheduled_date ?? ''
      const db = b.scheduled_date ?? ''
      return db.localeCompare(da)
    })

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
        {pending.length === 0 && approved.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-8 text-center space-y-3">
            <div className="text-4xl">✅</div>
            <p className="text-white font-semibold">Tudo certo por aqui!</p>
            <p className="text-zinc-500 text-sm">Nenhum conteúdo aguardando aprovação no momento.</p>
          </div>
        ) : (
          <>
            {/* Contador de pendentes */}
            {pending.length > 0 && (
              <div className="px-4 py-3 border-b border-zinc-800">
                <p className="text-zinc-400 text-sm">
                  <span className="text-white font-medium">{pending.length}</span> publicação{pending.length > 1 ? 'ões' : ''} aguardando sua aprovação
                </p>
              </div>
            )}

            {/* Publicações pendentes */}
            {pending.map((c, i) => {
              const isReel = c.type === 'reel'
              const isCarousel = c.type === 'carrossel' && c.media_urls && c.media_urls.length > 0
              const singleUrl = c.generated_image_url ?? null

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
                  {isCarousel ? (
                    <MediaCarousel urls={c.media_urls!} />
                  ) : isReel && singleUrl ? (
                    <div className="w-full bg-black" style={{ position: 'relative', paddingBottom: '177.78%', height: 0, overflow: 'hidden' }}>
                      <iframe
                        src={getDriveEmbedUrl(singleUrl)!}
                        allow="autoplay; fullscreen"
                        allowFullScreen
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                      />
                    </div>
                  ) : singleUrl ? (
                    <div className="w-full bg-zinc-900" style={{ aspectRatio: '4/5' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveImageUrl(singleUrl)!}
                        alt={c.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full bg-zinc-900 flex flex-col items-center justify-center gap-2" style={{ aspectRatio: '4/5' }}>
                      <span className="text-5xl">{TYPE_EMOJI[c.type] || '📄'}</span>
                      <p className="text-zinc-600 text-xs">Criativo não anexado</p>
                    </div>
                  )}

                  {/* Caption */}
                  <div className="px-4 pt-3 pb-1 space-y-2">
                    <p className="text-sm text-white leading-relaxed">
                      <span className="font-semibold">{client.name} </span>
                      <span className="text-zinc-300 whitespace-pre-wrap">{c.caption}</span>
                    </p>
                    {c.title && c.title !== c.caption && (
                      <p className="text-zinc-500 text-xs font-medium">{c.title}</p>
                    )}
                    {c.caption && (
                      <div className="pt-1">
                        <CopyCaptionButton caption={c.caption} />
                      </div>
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

                  {/* Download + WhatsApp */}
                  {(singleUrl || (c.media_urls && c.media_urls.length > 0)) && (
                    <div className="px-4 pb-2 space-y-2">
                      <DownloadButton
                        urls={isCarousel ? c.media_urls! : [singleUrl!]}
                        label={isReel ? 'Baixar vídeo' : 'Baixar imagem'}
                      />
                      {c.caption && (
                        <WhatsAppShareButton
                          caption={c.caption}
                          imageUrl={getDownloadUrl(singleUrl)}
                        />
                      )}
                    </div>
                  )}
                  {/* WhatsApp sem criativo (só legenda) */}
                  {!singleUrl && !(c.media_urls?.length) && c.caption && (
                    <div className="px-4 pb-2">
                      <WhatsAppShareButton caption={c.caption} />
                    </div>
                  )}

                  {/* Ações de aprovação */}
                  <div className="px-4 pb-4 pt-2">
                    <ApprovalActions contentId={c.id} token={token} />
                  </div>
                </article>
              )
            })}

            {/* ── Publicações já aprovadas ── */}
            {approved.length > 0 && (
              <>
                <div className="px-4 py-3 border-b border-zinc-800 border-t mt-4">
                  <p className="text-zinc-400 text-sm flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span><span className="text-white font-medium">{approved.length}</span> publicação{approved.length > 1 ? 'ões' : ''} aprovada{approved.length > 1 ? 's' : ''}</span>
                  </p>
                </div>

                {approved.map((c, i) => {
                  const isReel = c.type === 'reel'
                  const isCarousel = c.type === 'carrossel' && c.media_urls && c.media_urls.length > 0
                  const singleUrl = c.generated_image_url ?? null

                  return (
                    <article key={c.id} className={`border-b border-zinc-800 opacity-75 ${i > 0 ? 'mt-2' : ''}`}>
                      {/* Header com badge aprovado */}
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
                        <div className="flex items-center gap-2">
                          {c.scheduled_date && (
                            <span className="text-zinc-500 text-xs">{formatDate(c.scheduled_date)}</span>
                          )}
                          <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-950/40 border border-green-800/50 rounded-full px-2.5 py-0.5">
                            ✓ Aprovado
                          </span>
                        </div>
                      </div>

                      {/* Criativo */}
                      {isCarousel ? (
                        <MediaCarousel urls={c.media_urls!} />
                      ) : isReel && singleUrl ? (
                        <div className="w-full bg-black" style={{ position: 'relative', paddingBottom: '177.78%', height: 0, overflow: 'hidden' }}>
                          <iframe src={getDriveEmbedUrl(singleUrl)!} allow="autoplay; fullscreen" allowFullScreen
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }} />
                        </div>
                      ) : singleUrl ? (
                        <div className="w-full bg-zinc-900" style={{ aspectRatio: '4/5' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={resolveImageUrl(singleUrl)!} alt={c.title} className="w-full h-full object-cover" />
                        </div>
                      ) : null}

                      {/* Caption */}
                      {c.caption && (
                        <div className="px-4 pt-3 pb-1 space-y-2">
                          <p className="text-sm text-white leading-relaxed">
                            <span className="font-semibold">{client.name} </span>
                            <span className="text-zinc-300 whitespace-pre-wrap">{c.caption}</span>
                          </p>
                          <div className="flex gap-2 pt-1 flex-wrap">
                            <CopyCaptionButton caption={c.caption} />
                            {(singleUrl || (c.media_urls?.length ?? 0) > 0) && (
                              <DownloadButton
                                urls={isCarousel ? c.media_urls! : [singleUrl!]}
                                label={isReel ? 'Baixar vídeo' : 'Baixar imagem'}
                              />
                            )}
                          </div>
                          <WhatsAppShareButton
                            caption={c.caption}
                            imageUrl={getDownloadUrl(singleUrl)}
                          />
                        </div>
                      )}
                      <div className="pb-3" />
                    </article>
                  )
                })}
              </>
            )}
          </>
        )}
      </div>

      <footer className="text-center pb-8">
        <p className="text-zinc-700 text-xs">Agência Sua Mídia · aprovação exclusiva para {client.name}</p>
      </footer>
    </div>
  )
}
