import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { TIKTOK_AUTHORIZE_URL, TIKTOK_SCOPES, tiktokKeys, tiktokRedirectUri } from '@/lib/tiktok'

export const dynamic = 'force-dynamic'

// Inicia o login do TikTok para um cliente. Rota protegida pelo proxy (só a
// agência logada chega aqui). O "state" amarra a volta do TikTok ao cliente e
// ao navegador que começou o fluxo.
export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('cliente')
  if (!clientId || !/^[0-9a-f-]{36}$/i.test(clientId)) {
    return NextResponse.json({ error: 'Cliente inválido' }, { status: 400 })
  }
  // O cookie de segurança só volta para o mesmo endereço onde o fluxo começou,
  // e o TikTok devolve para o domínio oficial: começa sempre por ele.
  const canonical = new URL(tiktokRedirectUri())
  if (req.nextUrl.host !== canonical.host) {
    return NextResponse.redirect(new URL(`/api/tiktok/connect?cliente=${clientId}`, canonical.origin))
  }

  const keys = tiktokKeys()
  if (!keys) {
    return NextResponse.redirect(new URL(`/clients/${clientId}/integrations?tiktok=sem_chaves`, req.url))
  }

  const state = `${randomBytes(16).toString('hex')}.${clientId}`
  const url = new URL(TIKTOK_AUTHORIZE_URL)
  url.searchParams.set('client_key', keys.key)
  url.searchParams.set('scope', TIKTOK_SCOPES)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', tiktokRedirectUri())
  url.searchParams.set('state', state)

  const res = NextResponse.redirect(url)
  res.cookies.set('tiktok_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/api/tiktok',
    maxAge: 600,
  })
  return res
}
