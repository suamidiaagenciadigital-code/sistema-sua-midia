import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft } from 'lucide-react'
import { createTicketAction } from './actions'

export default async function NewTicketPage() {
  const supabase = await createClient()
  const { data: clients } = await supabase.from('clients').select('id, name').eq('status', 'ativo').order('name')

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/support" className="text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Novo ticket</h1>
          <p className="text-zinc-400 text-sm mt-0.5">A IA vai classificar e sugerir resposta automaticamente</p>
        </div>
      </div>

      <form action={createTicketAction} className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-zinc-300 font-medium">Cliente <span className="text-red-400">*</span></label>
          <select name="client_id" required className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500">
            <option value="">Selecione...</option>
            {clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-300 font-medium">Mensagem do cliente <span className="text-red-400">*</span></label>
          <textarea
            name="message"
            required
            rows={5}
            placeholder="Cole aqui a mensagem recebida do cliente via WhatsApp..."
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
          />
        </div>

        <button type="submit"
          className="w-full rounded-md bg-white py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors">
          Classificar com IA e criar ticket
        </button>
      </form>
    </div>
  )
}
