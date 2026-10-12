import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode, saveConnection, TIKTOK_API } from '@/lib/tiktok'

export const dynamic = 'force-dynamic'

// Volta do login do TikTok. Rota protegida pelo proxy (precisa da sessão da
// agência) e só aceita o "state" que o /connect gravou no cookie.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const denied = req.nextUrl.searchParams.get('error')
  const saved = req.cookies.get('tiktok_oauth_state')?.value

  const clientId = state?.split('.')[1]
  const back = (flag: string) => {
    const dest = clientId && /^[0-9a-f-]{36}$/i.test(clientId) ? `/clients/${clientId}/integrations` : '/dashboard'
    const res = NextResponse.redirect(new URL(`${dest}?tiktok=${flag}`, req.url))
    res.cookies.delete({ name: 'tiktok_oauth_state', path: '/api/tiktok' })
    return res
  }

  if (denied) return back('negado')
  if (!code || !state || !saved || saved !== state || !clientId) return back('estado_invalido')

  const token = await exchangeCode(code)
  if (!token.access_token || !token.refresh_token || !token.open_id) {
    console.error('[tiktok] troca de código falhou:', token.error, token.error_description)
    return back('erro_token')
  }

  // Nome do perfil — só para exibir quem está conectado
  let displayName: string | null = null
  try {
    const me = await fetch(`${TIKTOK_API}/user/info/?fields=open_id,display_name`, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    }).then((r) => r.json())
    displayName = me?.data?.user?.display_name ?? null
  } catch {}

  const { error } = await saveConnection(clientId, token, displayName)
  if (error) {
    console.error('[tiktok] erro ao salvar conexão:', error.message)
    return back('erro_salvar')
  }
  return back('conectado')
}
