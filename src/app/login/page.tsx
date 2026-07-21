import Image from 'next/image'
import { login } from './actions'

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#0b1326' }}
    >
      {/* Glow de fundo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(43,128,255,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm space-y-8 px-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/logo.png"
            alt="Sua Mídia — Agência Digital"
            width={280}
            height={75}
            priority
            className="w-auto"
            style={{ maxHeight: 75 }}
          />
          <p className="text-slate-500 text-sm">Acesse o painel da agência</p>
        </div>

        {/* Erro */}
        {error && (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{
              backgroundColor: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171',
            }}
          >
            E-mail ou senha incorretos.
          </div>
        )}

        {/* Card do formulário */}
        <div
          className="rounded-xl p-6 space-y-5"
          style={{
            backgroundColor: '#131b2e',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <form className="space-y-4" action={login}>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 mt-2"
              style={{
                background: 'linear-gradient(to right, #2B80FF, #A855F7)',
              }}
            >
              Entrar
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-700">
          Sistema Sua Mídia · Agência Digital
        </p>
      </div>
    </div>
  )
}
