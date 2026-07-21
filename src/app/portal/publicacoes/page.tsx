import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import PortalNav from '@/app/portal/_components/portal-nav'
import PortalPublicacoes from '@/app/portal/_components/portal-publicacoes'

export default async function PublicacoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const clientId = user.user_metadata?.client_id as string
  if (!clientId) redirect('/portal/login')

  const db = createServiceClient()

  // Dados do cliente
  const { data: client } = await db
    .from('clients')
    .select('id, name, niche')
    .eq('id', clientId)
    .single()

  if (!client) redirect('/portal/login')

  // Todas as publicações aprovadas e publicadas (incluindo stories)
  const { data: contents } = await db
    .from('contents')
    .select('id, title, type, caption, scheduled_date, scheduled_time, status, generated_image_url, media_urls')
    .eq('client_id', clientId)
    .in('status', ['approved_by_client', 'published'])
    .order('scheduled_date', { ascending: false })

  return (
    <div>
      <PortalNav clientName={client.name} active="publicacoes" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold">Publicações</h1>
          <p className="text-slate-400 text-sm mt-1">Todos os conteúdos aprovados e publicados</p>
        </div>
        <PortalPublicacoes contents={contents ?? []} />
      </main>
    </div>
  )
}
