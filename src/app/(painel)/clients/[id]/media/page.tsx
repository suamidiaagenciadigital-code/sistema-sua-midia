import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft } from 'lucide-react'
import MediaLibrary from './media-library'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tag?: string; type?: string }>
}

export default async function MediaPage({ params, searchParams }: Props) {
  const { id } = await params
  const sp = await searchParams

  const supabase = await createClient()
  const { data: client } = await supabase.from('clients').select('id, name').eq('id', id).single()
  if (!client) notFound()

  let query = supabase.from('media').select('*').eq('client_id', id).order('created_at', { ascending: false })
  if (sp.type) query = query.eq('file_type', sp.type)
  if (sp.tag) query = query.contains('tags', [sp.tag])

  const { data: files } = await query

  // Coletar todas as tags únicas
  const allTags = [...new Set((files ?? []).flatMap((f: any) => f.tags ?? []))]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/clients/${id}`} className="text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Biblioteca de mídia</h1>
          <p className="text-zinc-400 text-sm mt-0.5">{client.name}</p>
        </div>
      </div>

      <MediaLibrary
        clientId={id}
        files={files ?? []}
        allTags={allTags}
        activeTag={sp.tag}
        activeType={sp.type}
      />
    </div>
  )
}
