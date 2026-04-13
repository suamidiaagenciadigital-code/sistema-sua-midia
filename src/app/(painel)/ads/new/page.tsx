import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft } from 'lucide-react'
import { AdsGenerator } from './ads-generator'

export default async function NewCampaignPage() {
  const supabase = await createClient()
  const { data: clients } = await supabase.from('clients').select('id, name').eq('status', 'ativo').order('name')

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/ads" className="text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Nova campanha</h1>
          <p className="text-zinc-400 text-sm mt-0.5">A IA vai gerar estratégia, copies e sugestão de público</p>
        </div>
      </div>

      <AdsGenerator clients={clients ?? []} />
    </div>
  )
}
