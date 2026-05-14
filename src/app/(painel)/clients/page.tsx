import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, CalendarDays, Users } from 'lucide-react'
import { Client } from '@/lib/types'

const statusLabel: Record<string, string> = {
  ativo: 'Ativo',
  pausado: 'Pausado',
  encerrado: 'Encerrado',
}

const statusStyle: Record<string, React.CSSProperties> = {
  ativo: { backgroundColor: '#16a34a', color: '#fff' },
  pausado: { backgroundColor: '#d97706', color: '#fff' },
  encerrado: { backgroundColor: '#374151', color: '#9ca3af' },
}

function ClientIcon() {
  return (
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
      style={{ background: 'linear-gradient(135deg, rgba(43,128,255,0.25), rgba(168,85,247,0.25))', border: '1px solid rgba(43,128,255,0.3)' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="icon-g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2B80FF"/>
            <stop offset="100%" stopColor="#A855F7"/>
          </linearGradient>
        </defs>
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="url(#icon-g)" strokeWidth="1.5" fill="none"/>
        <path d="M9 22V12h6v10" stroke="url(#icon-g)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, niche, status, created_at')
    .order('name')

  const count = clients?.length ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Clientes</h1>
          <p className="text-slate-500 text-sm mt-1">
            {count} cliente{count !== 1 ? 's' : ''} cadastrado{count !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/clients/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(to right, #2B80FF, #A855F7)' }}
        >
          <Plus className="h-4 w-4" />
          Novo cliente
        </Link>
      </div>

      {/* Tabela */}
      {!clients?.length ? (
        <div
          className="rounded-xl p-16 flex flex-col items-center text-slate-600"
          style={{ backgroundColor: '#131b2e', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Users className="h-10 w-10 mb-3" />
          <p className="text-sm font-medium">Nenhum cliente ainda</p>
          <p className="text-xs mt-1">Clique em "Novo cliente" para começar</p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: '#131b2e', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Accent bar top */}
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(to right, #2B80FF, #A855F7)' }} />

          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-widest uppercase" style={{ color: '#475569' }}>Cliente</th>
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-widest uppercase" style={{ color: '#475569' }}>Nicho</th>
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-widest uppercase" style={{ color: '#475569' }}>Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold tracking-widest uppercase" style={{ color: '#475569' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client: Partial<Client> & { id: string }) => (
                <tr
                  key={client.id}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={undefined}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <ClientIcon />
                      <span className="font-semibold text-white">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 max-w-xs">{client.niche}</td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
                      style={statusStyle[client.status ?? 'ativo']}
                    >
                      {statusLabel[client.status ?? 'ativo']}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/clients/${client.id}/calendar`}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                      >
                        <CalendarDays className="h-3.5 w-3.5" />
                        Calendário
                      </Link>
                      <div className="w-px h-4" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
                      <Link
                        href={`/clients/${client.id}`}
                        className="text-xs font-semibold transition-colors"
                        style={{ color: '#2B80FF' }}
                      >
                        Ver perfil →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
