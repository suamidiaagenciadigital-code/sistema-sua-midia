import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { resolvePortalClient } from '@/lib/portal-session'
import PortalNav from '@/app/portal/_components/portal-nav'
import PortalPublicacoes from '@/app/portal/_components/portal-publicacoes'

export default async function PublicacoesPage({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const sp = await searchParams
  const { clientId, isPreview } = await resolvePortalClient(sp.cliente)

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
      <PortalNav clientName={client.name} active="publicacoes" previewClientId={isPreview ? clientId : undefined} />
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
