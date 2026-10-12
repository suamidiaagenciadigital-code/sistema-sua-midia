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

  // app_metadata: só o servidor grava (user_metadata é editável pelo próprio usuário)
  const role = user.app_metadata?.role as string | undefined

  if (role !== 'agency') {
    const clientId = role === 'client' ? (user.app_metadata?.client_id as string | undefined) : undefined
    if (!clientId) redirect('/portal/login')
    return { clientId, isPreview: false }
  }

  if (!cliente) redirect('/dashboard')
  return { clientId: cliente, isPreview: true }
}
