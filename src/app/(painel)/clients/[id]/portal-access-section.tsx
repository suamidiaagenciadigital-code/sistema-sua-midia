'use client'

import { useState } from 'react'
import { Monitor, Eye, EyeOff, ExternalLink } from 'lucide-react'

export function PortalAccessSection({
  clientId,
  hasAccess,
}: {
  clientId: string
  hasAccess: boolean
}) {
  const [mode, setMode]       = useState<'idle' | 'form' | 'success'>('idle')
  const [saving, setSaving]   = useState(false)
  const [removing, setRemoving] = useState(false)
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [active, setActive]   = useState(hasAccess)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch('/api/portal/create-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, email, password }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Erro ao criar acesso'); return }
    setActive(true)
    setMode('success')
  }

  async function handleRemove() {
    if (!confirm('Remover acesso ao portal deste cliente?')) return
    setRemoving(true)
    await fetch(`/api/portal/create-access?client_id=${clientId}`, { method: 'DELETE' })
    setRemoving(false)
    setActive(false)
    setMode('idle')
    setEmail('')
    setPassword('')
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
            <Monitor className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Portal do Cliente</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {active ? '✓ Acesso ativo' : 'Sem acesso configurado'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {active && (
            <a
              href="https://sistema.suamidia.com.br/portal"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-1.5 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Abrir portal
            </a>
          )}
          {active ? (
            <button
              onClick={() => setMode('form')}
              className="text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-1.5 transition-colors"
            >
              Alterar senha
            </button>
          ) : (
            <button
              onClick={() => setMode('form')}
              className="text-xs text-white rounded-lg px-3 py-1.5 transition-opacity"
              style={{ background: 'linear-gradient(to right, #2B80FF, #A855F7)' }}
            >
              Criar acesso
            </button>
          )}
        </div>
      </div>

      {/* Formulário */}
      {mode === 'form' && (
        <form onSubmit={handleCreate} className="border-t border-zinc-800 px-5 py-4 space-y-3">
          <p className="text-sm text-zinc-300 font-medium">
            {active ? 'Atualizar credenciais do portal' : 'Criar acesso ao portal'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="cliente@email.com"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Mín. 6 caracteres"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 pr-9 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60 transition-opacity"
              style={{ background: 'linear-gradient(to right, #2B80FF, #A855F7)' }}
            >
              {saving ? 'Salvando...' : active ? 'Atualizar' : 'Criar acesso'}
            </button>
            <button type="button" onClick={() => { setMode('idle'); setError(null) }}
              className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white border border-zinc-700 text-sm transition-colors">
              Cancelar
            </button>
            {active && (
              <button type="button" onClick={handleRemove} disabled={removing}
                className="ml-auto px-4 py-2 rounded-lg text-red-400 hover:text-red-300 border border-red-900/50 text-sm transition-colors disabled:opacity-60">
                {removing ? 'Removendo...' : 'Remover acesso'}
              </button>
            )}
          </div>
        </form>
      )}

      {mode === 'success' && (
        <div className="border-t border-zinc-800 px-5 py-3 flex items-center gap-2">
          <span className="text-green-400 text-sm">✓ Acesso criado com sucesso.</span>
          <span className="text-zinc-500 text-xs">Link: sistema.suamidia.com.br/portal</span>
          <button onClick={() => setMode('idle')} className="ml-auto text-xs text-zinc-500 hover:text-zinc-300">Fechar</button>
        </div>
      )}
    </div>
  )
}
