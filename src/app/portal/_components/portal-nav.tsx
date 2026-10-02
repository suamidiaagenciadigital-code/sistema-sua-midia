'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/portal/metricas', label: 'Resumo', key: 'metricas' },
  { href: '/portal/publicacoes', label: 'Publicações', key: 'publicacoes' },
  { href: '/portal/calendario', label: 'Calendário', key: 'calendario' },
]

export default function PortalNav({ clientName, active, previewClientId }: { clientName: string; active: string; previewClientId?: string }) {
  const router = useRouter()
  const suffix = previewClientId ? `?cliente=${previewClientId}` : ''

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/portal/login')
    router.refresh()
  }

  return (
    <>
    {previewClientId && (
      <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs px-4 py-2 flex items-center justify-between gap-3">
        <span>Visualizando como o cliente <strong>{clientName}</strong> — só você (agência) vê este aviso.</span>
        <Link href={`/clients/${previewClientId}`} className="underline hover:text-amber-200 shrink-0">Voltar ao painel</Link>
      </div>
    )}
    <header className="border-b border-slate-800 bg-[#0d1628]">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo + nome */}
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Sua Mídia" className="h-7" />
          <span className="text-slate-600 text-xs">|</span>
          <p className="text-slate-400 text-xs">{clientName}</p>
        </div>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {NAV.map(item => (
            <Link
              key={item.key}
              href={`${item.href}${suffix}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active === item.key
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Sair (no modo "ver como o cliente" não há login do cliente para encerrar) */}
        {!previewClientId && (
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
          >
            Sair
          </button>
        )}
      </div>

      {/* Nav mobile */}
      <div className="sm:hidden flex border-t border-slate-800">
        {NAV.map(item => (
          <Link
            key={item.key}
            href={`${item.href}${suffix}`}
            className={`flex-1 text-center py-2.5 text-sm font-medium transition-colors ${
              active === item.key
                ? 'text-white border-b-2 border-blue-500'
                : 'text-slate-500'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </header>
    </>
  )
}
