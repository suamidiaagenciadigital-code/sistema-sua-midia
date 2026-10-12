import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { GBP_SCOPE, GOOGLE_AUTH_URL, googleKeys, googleRedirectUri } from '@/lib/google-business'

export const dynamic = 'force-dynamic'

// Inicia o login do Google da agência. Protegida pelo proxy (só quem está
// logado no sistema chega aqui).
export async function GET(req: NextRequest) {
  // O cookie de segurança só volta ao mesmo endereço onde o fluxo começou, e o
  // Google devolve para o domínio oficial: começa sempre por ele.
  const canonical = new URL(googleRedirectUri())
  if (req.nextUrl.host !== canonical.host) {
    return NextResponse.redirect(new URL('/api/google/connect', canonical.origin))
  }

  const keys = googleKeys()
  if (!keys) return NextResponse.redirect(new URL('/settings?google=sem_chaves', req.url))

  const state = randomBytes(16).toString('hex')
  const url = new URL(GOOGLE_AUTH_URL)
  url.searchParams.set('client_id', keys.id)
  url.searchParams.set('redirect_uri', googleRedirectUri())
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', GBP_SCOPE)
  url.searchParams.set('access_type', 'offline') // sem isso não vem refresh token
  url.searchParams.set('prompt', 'consent')      // força devolver o refresh token
  url.searchParams.set('state', state)

  const res = NextResponse.redirect(url)
  res.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/api/google',
    maxAge: 600,
  })
  return res
}
