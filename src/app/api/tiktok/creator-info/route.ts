import { NextRequest, NextResponse } from 'next/server'
import { getTikTokAccessToken, tiktokPost } from '@/lib/tiktok'

export const dynamic = 'force-dynamic'

// Dados da conta que vai receber o vídeo. O TikTok exige consultar isto SEMPRE
// que a tela de postagem abre (nome da conta, visibilidades permitidas,
// interações desativadas na conta e duração máxima do vídeo). Rota protegida
// pelo proxy: só a agência logada chega aqui. Nunca devolve token.
export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('cliente')
  if (!clientId || !/^[0-9a-f-]{36}$/i.test(clientId)) {
    return NextResponse.json({ ok: false, error: 'Cliente inválido' }, { status: 400 })
  }

  const { token, error } = await getTikTokAccessToken(clientId)
  if (!token) return NextResponse.json({ ok: false, error: error ?? 'TikTok não conectado' }, { status: 400 })

  const res = await tiktokPost('/post/publish/creator_info/query/', token, {})
  if (res?.error?.code && res.error.code !== 'ok') {
    return NextResponse.json({ ok: false, error: res.error.message ?? `TikTok: ${res.error.code}` }, { status: 502 })
  }

  const d = res?.data ?? {}
  return NextResponse.json({
    ok: true,
    audited: process.env.TIKTOK_AUDITED === 'true',
    creator: {
      nickname: d.creator_nickname ?? d.creator_username ?? '',
      username: d.creator_username ?? '',
      avatar: d.creator_avatar_url ?? null,
    },
    privacyOptions: (d.privacy_level_options ?? []) as string[],
    commentDisabled: !!d.comment_disabled,
    duetDisabled: !!d.duet_disabled,
    stitchDisabled: !!d.stitch_disabled,
    maxVideoSeconds: Number(d.max_video_post_duration_sec ?? 0) || null,
  })
}
