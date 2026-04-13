import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ContentGenerator from './content-generator'

interface Props {
  params: Promise<{ id: string }>
}

export default async function NewContentPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: client } = await supabase.from('clients').select('id, name, niche').eq('id', id).single()

  if (!client) notFound()

  return <ContentGenerator clientId={id} clientName={client.name} />
}
