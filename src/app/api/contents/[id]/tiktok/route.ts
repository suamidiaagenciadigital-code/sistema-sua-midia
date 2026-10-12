import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rehostIfDriveVideo } from '@/lib/rehost-video'
import { getTikTokAccessToken, tiktokPost } from '@/lib/tiktok'

// Baixa o vídeo e sobe em partes para o TikTok; depois acompanha o processamento
export const maxDuration = 300
export const dynamic = 'force-dynamic'

const SINGLE_CHUNK_MAX = 64 * 1024 * 1024
const BIG_CHUNK = 32 * 1024 * 1024

function isVideoUrl(url: string | null | undefined): boolean {
  return !!url && /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url)
}

async function saveResult(contentId: string, patch: Record<string, string | null>) {
  await createServiceClient().from('contents').update(patch).eq('id', contentId)
}

function fail(contentId: string, message: string, status = 502) {
  return saveResult(contentId, { tiktok_status: 'FAILED', tiktok_publish_error: message }).then(() =>
    NextResponse.json({ ok: false, error: message }, { status }),
  )
}

// Mensagens em português para os erros mais comuns do TikTok
function explain(code: string | undefined, message: string | undefined): string {
  if (code === 'unaudited_client_can_only_post_to_private_accounts') {
    return 'O app do TikTok ainda não foi auditado: só publica em conta privada. Deixe a conta do TikTok como privada para testar, ou peça a auditoria do app.'
  }
  if (code === 'spam_risk_too_many_posts') return 'O TikTok limitou os envios de hoje (muitos posts). Tente amanhã.'
  if (code === 'access_token_invalid' || code === 'scope_not_authorized') {
    return 'A conexão com o TikTok não tem permissão para publicar. Conecte de novo em Integrações.'
  }
  return message ? `TikTok: ${message}` : `TikTok: erro ${code ?? 'desconhecido'}`
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: contentId } = await params
  const supabase = createServiceClient()

  const { data: content } = await supabase
    .from('contents')
    .select('id, client_id, type, title, caption, generated_image_url, media_urls')
    .eq('id', contentId)
    .single()
  if (!content) return NextResponse.json({ error: 'Conteúdo não encontrado' }, { status: 404 })

  const { token, error: tokenError } = await getTikTokAccessToken(content.client_id)
  if (!token) return fail(contentId, tokenError ?? 'TikTok não conectado', 400)

  // Fonte do vídeo: link do campo principal, ou o primeiro item de media_urls
  const media = Array.isArray(content.media_urls) ? (content.media_urls as string[]) : []
  const source: string | null = content.generated_image_url || media[0] || null
  if (!source) return fail(contentId, 'Este conteúdo não tem vídeo.', 400)

  const videoUrl = await rehostIfDriveVideo(source, content.client_id)
  if (!videoUrl || /drive\.google\.com/.test(videoUrl)) {
    return fail(contentId, 'Não consegui baixar o vídeo do Drive. Suba o vídeo pelo computador e tente de novo.')
  }
  if (content.type !== 'reel' && !isVideoUrl(videoUrl)) {
    return fail(contentId, 'O TikTok só recebe vídeo por aqui (imagens ainda não).', 400)
  }

  // 1) Que tipos de visibilidade esta conta aceita?
  const creator = await tiktokPost('/post/publish/creator_info/query/', token, {})
  if (creator?.error?.code && creator.error.code !== 'ok') {
    return fail(contentId, explain(creator.error.code, creator.error.message))
  }
  const options: string[] = creator?.data?.privacy_level_options ?? []
  // Enquanto o app não for auditado o TikTok só aceita SELF_ONLY (e recusa
  // qualquer outro nível mesmo que a lista de opções o ofereça). Depois da
  // auditoria, definir TIKTOK_AUDITED=true na Vercel.
  const audited = process.env.TIKTOK_AUDITED === 'true'
  const privacy = !audited
    ? 'SELF_ONLY'
    : options.includes('PUBLIC_TO_EVERYONE') ? 'PUBLIC_TO_EVERYONE' : options[0] ?? 'SELF_ONLY'

  // 2) Baixa o vídeo
  const file = await fetch(videoUrl, { signal: AbortSignal.timeout(120_000) })
  if (!file.ok) return fail(contentId, `Não consegui baixar o vídeo (${file.status}).`)
  const bytes = new Uint8Array(await file.arrayBuffer())
  const size = bytes.byteLength
  const mime = file.headers.get('content-type')?.startsWith('video/') ? file.headers.get('content-type')! : 'video/mp4'

  const chunkSize = size <= SINGLE_CHUNK_MAX ? size : BIG_CHUNK
  const totalChunks = Math.max(1, Math.floor(size / chunkSize)) // a última parte absorve o resto

  // 3) Inicia o envio
  const title = (content.caption || content.title || '').toString().slice(0, 2200)
  const init = await tiktokPost('/post/publish/video/init/', token, {
    post_info: { title, privacy_level: privacy, disable_duet: false, disable_stitch: false, disable_comment: false },
    source_info: { source: 'FILE_UPLOAD', video_size: size, chunk_size: chunkSize, total_chunk_count: totalChunks },
  })
  const publishId: string | undefined = init?.data?.publish_id
  const uploadUrl: string | undefined = init?.data?.upload_url
  if (!publishId || !uploadUrl) {
    return fail(contentId, explain(init?.error?.code, init?.error?.message))
  }
  await saveResult(contentId, { tiktok_publish_id: publishId, tiktok_status: 'UPLOADING', tiktok_publish_error: null })

  // 4) Sobe as partes
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize
    const end = i === totalChunks - 1 ? size - 1 : start + chunkSize - 1
    const part = bytes.slice(start, end + 1)
    const put = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': mime,
        'Content-Length': String(part.byteLength),
        'Content-Range': `bytes ${start}-${end}/${size}`,
      },
      body: part,
    })
    if (!put.ok && put.status !== 201 && put.status !== 206) {
      return fail(contentId, `Falha ao enviar o vídeo ao TikTok (parte ${i + 1}, HTTP ${put.status}).`)
    }
  }

  // 5) Acompanha o processamento por até ~90s
  let status = 'PROCESSING_UPLOAD'
  let failReason: string | undefined
  for (let i = 0; i < 18; i++) {
    await new Promise((r) => setTimeout(r, 5000))
    const st = await tiktokPost('/post/publish/status/fetch/', token, { publish_id: publishId })
    status = st?.data?.status ?? status
    if (status === 'PUBLISH_COMPLETE' || status === 'FAILED') {
      failReason = st?.data?.fail_reason
      break
    }
  }

  if (status === 'FAILED') return fail(contentId, `TikTok recusou o vídeo: ${failReason ?? 'motivo não informado'}`)

  await saveResult(contentId, { tiktok_status: status, tiktok_publish_error: null })
  return NextResponse.json({
    ok: true,
    status,
    privacy,
    publish_id: publishId,
    concluido: status === 'PUBLISH_COMPLETE',
  })
}
