import { login } from './actions'

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-sm space-y-8 px-6">
        {/* Logo / Marca */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Sua Mídia</h1>
          <p className="text-zinc-400 mt-2 text-sm">Painel da Agência</p>
        </div>

        {/* Erro */}
        {error && (
          <div className="rounded-md bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400">
            E-mail ou senha incorretos.
          </div>
        )}

        {/* Formulário */}
        <form className="space-y-4" action={login}>
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm text-zinc-400">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm text-zinc-400">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-white py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}
