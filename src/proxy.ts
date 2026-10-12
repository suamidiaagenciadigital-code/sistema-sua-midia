import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Rotas 100% públicas ────────────────────────────────────────────────
  if (
    pathname.startsWith('/approve/') ||
    pathname.startsWith('/propostas/') ||
    pathname === '/termos' ||
    // arquivos de verificação de URL do TikTok (public/<pagina>/tiktok*.txt)
    /^\/(termos|privacidade)\/tiktok[\w-]+\.txt$/.test(pathname) ||
    pathname === '/privacidade' ||
    pathname.startsWith('/api/webhooks/') ||
    pathname.startsWith('/api/public-approval') ||
    pathname.startsWith('/api/download') ||
    pathname.startsWith('/api/cron/')
  ) {
    return supabaseResponse
  }

  // ── Chamadas internas do cron (publish-now sem sessão de usuário) ──────
  const cronSecret = request.headers.get('x-cron-secret')
  if (cronSecret && cronSecret === process.env.CRON_SECRET) {
    return supabaseResponse
  }

  const isPortalRoute  = pathname.startsWith('/portal')
  const isPortalLogin  = pathname === '/portal/login'
  const isAgencyLogin  = pathname === '/login'

  // O papel vem de app_metadata, que só o servidor consegue gravar. user_metadata
  // o próprio usuário edita (supabase.auth.updateUser), então NUNCA serve para
  // decidir acesso. Sem papel "agency" explícito, trata como cliente (menor privilégio).
  const role = user?.app_metadata?.role as string | undefined
  const isClientUser   = role !== 'agency'

  // ── Portal do cliente ──────────────────────────────────────────────────
  if (isPortalRoute) {
    // Página de login do portal: sempre pública
    if (isPortalLogin) return supabaseResponse
    // Não autenticado → login do portal
    if (!user) return NextResponse.redirect(new URL('/portal/login', request.url))
    // Agência pode abrir o portal em modo "ver como o cliente" (?cliente=<id>);
    // quem decide de qual cliente é a tela é resolvePortalClient()
    // (src/lib/portal-session.ts) — cliente nunca enxerga outro cliente.
    return supabaseResponse
  }

  // ── Painel da agência ──────────────────────────────────────────────────
  // Cliente tentando acessar área da agência → redireciona para o portal
  if (user && isClientUser && !isAgencyLogin) {
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  // Não autenticado tentando acessar área protegida
  if (!user && !isAgencyLogin) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Autenticado (agência) tentando acessar login
  if (user && isAgencyLogin) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
