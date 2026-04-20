import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft } from 'lucide-react'
import { createStoryAction } from './actions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function NewStoryPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, facebook_page_id, instagram_account_id')
    .eq('id', id)
    .single()

  if (!client) notFound()

  const hasFacebook  = !!client.facebook_page_id
  const hasInstagram = !!client.instagram_account_id

  const action = createStoryAction.bind(null, id)

  // Data de amanhã como padrão
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultDate = tomorrow.toISOString().split('T')[0]

  const inputCls = "w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"

  return (
    <div className="max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/clients/${id}`} className="text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Publicar Story</h1>
          <p className="text-zinc-400 text-sm mt-0.5">{client.name} · sem aprovação do cliente</p>
        </div>
      </div>

      <form action={action} className="space-y-5">

        {/* URL da mídia */}
        <div className="space-y-1">
          <label className="text-sm text-zinc-300 font-medium">
            URL da mídia <span className="text-red-400">*</span>
          </label>
          <input
            type="url"
            name="media_url"
            required
            placeholder="https://drive.google.com/file/d/..."
            className={inputCls}
          />
          <p className="text-xs text-zinc-500">Link do Google Drive (imagem ou vídeo com acesso público)</p>
        </div>

        {/* Tipo de mídia */}
        <div className="space-y-1">
          <label className="text-sm text-zinc-300 font-medium">Tipo de mídia</label>
          <select name="media_type" className={inputCls}>
            <option value="image">🖼️ Imagem</option>
            <option value="video">🎬 Vídeo</option>
          </select>
        </div>

        {/* Data e hora */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-zinc-300 font-medium">
              Data <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              name="scheduled_date"
              required
              defaultValue={defaultDate}
              className={inputCls}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-zinc-300 font-medium">Horário</label>
            <input
              type="time"
              name="scheduled_time"
              defaultValue="09:00"
              className={inputCls}
            />
          </div>
        </div>

        {/* Plataformas */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-300 font-medium">Publicar em</label>
          <div className="flex gap-4">
            <label className={`flex items-center gap-2.5 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${hasFacebook ? 'border-zinc-700 hover:border-zinc-500' : 'border-zinc-800 opacity-40 cursor-not-allowed'}`}>
              <input
                type="checkbox"
                name="platform_facebook"
                value="1"
                defaultChecked={hasFacebook}
                disabled={!hasFacebook}
                className="accent-blue-500"
              />
              <span className="text-sm text-white">Facebook</span>
              {!hasFacebook && <span className="text-xs text-zinc-600">(não configurado)</span>}
            </label>

            <label className={`flex items-center gap-2.5 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${hasInstagram ? 'border-zinc-700 hover:border-zinc-500' : 'border-zinc-800 opacity-40 cursor-not-allowed'}`}>
              <input
                type="checkbox"
                name="platform_instagram"
                value="1"
                defaultChecked={hasInstagram}
                disabled={!hasInstagram}
                className="accent-pink-500"
              />
              <span className="text-sm text-white">Instagram</span>
              {!hasInstagram && <span className="text-xs text-zinc-600">(não configurado)</span>}
            </label>
          </div>
          <p className="text-xs text-zinc-500">
            Instagram agenda como story · Facebook agenda como post de imagem
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-md bg-white px-6 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            Agendar story
          </button>
          <Link
            href={`/clients/${id}`}
            className="rounded-md border border-zinc-700 px-6 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
