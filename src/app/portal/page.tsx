import { redirect } from 'next/navigation'
import { resolvePortalClient } from '@/lib/portal-session'

export default async function PortalPage({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const sp = await searchParams
  const { clientId, isPreview } = await resolvePortalClient(sp.cliente)
  redirect(isPreview ? `/portal/metricas?cliente=${clientId}` : '/portal/metricas')
}
