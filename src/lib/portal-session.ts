import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface PortalContext {
  clientId: string
  /** true quando a agência está vendo o portal "como o cliente" (?cliente=<id>) */
  isPreview: boolean
}

// Quem é o dono da tela do portal.
// - Cliente logado: sempre o próprio client_id do login — o parâmetro ?cliente
//   é ignorado, então um cliente nunca consegue ver os dados de outro.
// - Agência logada: precisa informar ?cliente=<id> (modo "ver como o cliente").
export async function resolvePortalClient(cliente?: string): Promise<PortalContext> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const role = (user.user_metadata?.role as string | undefined) ?? 'agency'

  if (role === 'client') {
    const clientId = user.user_metadata?.client_id as string | undefined
    if (!clientId) redirect('/portal/login')
    return { clientId, isPreview: false }
  }

  if (!cliente) redirect('/dashboard')
  return { clientId: cliente, isPreview: true }
}
