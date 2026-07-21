import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EditPropostaForm } from './edit-form'

interface Props { params: Promise<{ id: string }> }

export default async function EditarPropostaPage({ params }: Props) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: p } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', id)
    .single()

  if (!p) notFound()

  return <EditPropostaForm proposal={p} />
}
