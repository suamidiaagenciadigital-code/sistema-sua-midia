import { NextRequest, NextResponse } from 'next/server'
import { exchangeGoogleCode, saveGoogleConnection } from '@/lib/google-business'

export const dynamic = 'force-dynamic'

// Volta do login do Google. Protegida pelo proxy (precisa da sessão da agência)
// e só aceita o "state" que o /connect gravou no cookie.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const denied = req.nextUrl.searchParams.get('error')
  const saved = req.cookies.get('google_oauth_state')?.value

  const back = (flag: string) => {
    const res = NextResponse.redirect(new URL(`/settings?google=${flag}`, req.url))
    res.cookies.delete({ name: 'google_oauth_state', path: '/api/google' })
    return res
  }

  if (denied) return back('negado')
  if (!code || !state || !saved || saved !== state) return back('estado_invalido')

  const t = await exchangeGoogleCode(code)
  if (!t.refresh_token) {
    console.error('[google] sem refresh_token:', t.error, t.error_description)
    return back('sem_refresh')
  }

  const { error } = await saveGoogleConnection(t.refresh_token, t.scope ?? null)
  if (error) {
    console.error('[google] erro ao salvar conexão:', error.message)
    return back('erro_salvar')
  }
  return back('conectado')
}
