import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Users, CalendarDays } from 'lucide-react'
import { Client } from '@/lib/types'

const statusLabel: Record<string, string> = {
  ativo: 'Ativo',
  pausado: 'Pausado',
  encerrado: 'Encerrado',
}

const statusColor: Record<string, string> = {
  ativo: 'bg-green-900/40 text-green-400 border-green-800',
  pausado: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  encerrado: 'bg-zinc-800 text-zinc-500 border-zinc-700',
}

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, niche, status, created_at')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {clients?.length ?? 0} cliente{clients?.length !== 1 ? 's' : ''} cadastrado{clients?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/clients/new"
          className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo cliente
        </Link>
      </div>

      {!clients?.length ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-16 flex flex-col items-center text-zinc-600">
          <Users className="h-10 w-10 mb-3" />
          <p className="text-sm font-medium">Nenhum cliente ainda</p>
          <p className="text-xs mt-1">Clique em "Novo cliente" para começar</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Cliente</th>
                <th className="text-left px-5 py-3 font-medium">Nicho</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {clients.map((client: Partial<Client> & { id: string }) => (
                <tr key={client.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-5 py-4 font-medium text-white">{client.name}</td>
                  <td className="px-5 py-4 text-zinc-400">{client.niche}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${statusColor[client.status ?? 'ativo']}`}>
                      {statusLabel[client.status ?? 'ativo']}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/clients/${client.id}/calendar`}
                        className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-xs"
                      >
                        <CalendarDays className="h-3.5 w-3.5" />
                        Calendário
                      </Link>
                      <Link
                        href={`/clients/${client.id}`}
                        className="text-zinc-400 hover:text-white transition-colors text-xs"
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
