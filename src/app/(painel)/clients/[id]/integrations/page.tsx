import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { Client } from '@/lib/types'
import { updateIntegrationsAction } from './actions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function IntegrationsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: client } = await supabase.from('clients').select('*').eq('id', id).single()
  if (!client) notFound()

  const c = client as Client
  const update = updateIntegrationsAction.bind(null, id)

  const hasFacebook = !!c.facebook_page_id && !!c.facebook_page_token
  const hasInstagram = !!c.instagram_account_id

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/clients/${id}`} className="text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Integrações</h1>
          <p className="text-zinc-400 text-sm mt-0.5">{c.name} · Meta Business</p>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`rounded-lg border p-4 flex items-center gap-3 ${
          hasFacebook
            ? 'border-blue-800/60 bg-blue-950/20'
            : 'border-zinc-800 bg-zinc-900'
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            hasFacebook ? 'bg-blue-900/50' : 'bg-zinc-800'
          }`}>
            {/* Facebook icon */}
            <svg viewBox="0 0 24 24" className={`h-5 w-5 fill-current ${hasFacebook ? 'text-blue-400' : 'text-zinc-500'}`}>
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Facebook</p>
            <div className="flex items-center gap-1 mt-0.5">
              {hasFacebook ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-400">Configurado</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 text-zinc-500" />
                  <span className="text-xs text-zinc-500">Não configurado</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={`rounded-lg border p-4 flex items-center gap-3 ${
          hasInstagram
            ? 'border-pink-800/60 bg-pink-950/20'
            : 'border-zinc-800 bg-zinc-900'
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            hasInstagram ? 'bg-pink-900/50' : 'bg-zinc-800'
          }`}>
            {/* Instagram icon */}
            <svg viewBox="0 0 24 24" className={`h-5 w-5 fill-current ${hasInstagram ? 'text-pink-400' : 'text-zinc-500'}`}>
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Instagram</p>
            <div className="flex items-center gap-1 mt-0.5">
              {hasInstagram ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-400">Configurado</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 text-zinc-500" />
                  <span className="text-xs text-zinc-500">Não configurado</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <form action={update} className="space-y-6">

        {/* Facebook */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-zinc-800">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-blue-400">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <h2 className="text-sm font-semibold text-white">Facebook Page</h2>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-zinc-300 font-medium">Facebook Page ID</label>
            <input
              type="text"
              name="facebook_page_id"
              defaultValue={c.facebook_page_id ?? ''}
              placeholder="Ex: 123456789012345"
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
            <p className="text-xs text-zinc-500">
              ID numérico da página — Meta Business Suite → Configurações → Informações da página
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-zinc-300 font-medium">Facebook Page Token</label>
            <input
              type="text"
              name="facebook_page_token"
              defaultValue={c.facebook_page_token ?? ''}
              placeholder="EAABsb..."
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 font-mono text-xs"
            />
            <p className="text-xs text-zinc-500">
              Page Access Token permanente — Meta Business Suite → Configurações → Acesso avançado → Token da página
            </p>
          </div>
        </div>

        {/* Instagram */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-zinc-800">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-pink-400">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <h2 className="text-sm font-semibold text-white">Instagram Business</h2>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-zinc-300 font-medium">Instagram Account ID</label>
            <input
              type="text"
              name="instagram_account_id"
              defaultValue={c.instagram_account_id ?? ''}
              placeholder="Ex: 17841400000000000"
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
            <p className="text-xs text-zinc-500">
              ID numérico da conta Instagram Business vinculada à página do Facebook
            </p>
          </div>

          <div className="rounded-md bg-zinc-800/50 border border-zinc-700/50 p-3 text-xs text-zinc-400 space-y-1">
            <p className="font-medium text-zinc-300">Como encontrar o Instagram Account ID:</p>
            <p>1. Acesse o <span className="text-zinc-300">Graph API Explorer</span> em developers.facebook.com/tools/explorer</p>
            <p>2. Selecione a página do cliente</p>
            <p>3. Faça a requisição: <code className="bg-zinc-700 px-1 rounded text-zinc-200">GET /me?fields=instagram_business_account</code></p>
            <p>4. O <code className="bg-zinc-700 px-1 rounded text-zinc-200">id</code> retornado é o Instagram Account ID</p>
          </div>
        </div>

        {/* Importação automática do Drive */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-zinc-800">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-amber-400">
              <path d="M7.71 3.5L1.15 15l3.43 6h6.56l6.56-11.5L14.27 3.5zm1.15 2h6.42l4.86 8.5H9.86zM4.02 16l3.15-5.51 4.86 8.51H7.71zm8.63 3l3.13-5.48L19.15 19z"/>
            </svg>
            <h2 className="text-sm font-semibold text-white">Importação automática do Drive</h2>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-zinc-300 font-medium">ID da pasta raiz no Drive</label>
            <input
              type="text"
              name="drive_folder_id"
              defaultValue={c.drive_folder_id ?? ''}
              placeholder="Ex: 11n_z-ekPVjr4fB7LRw3iGSCliqTo2H7Y"
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 font-mono text-xs"
            />
            <p className="text-xs text-zinc-500">
              Pasta que contém as pastas de cada mês (ex: SETEMBRO), que por sua vez contêm os dias (ex: 09-09).
              O ID é o trecho após <code className="bg-zinc-800 px-1 rounded">/folders/</code> no link do Drive.
              Deixe em branco para desativar a importação automática deste cliente.
            </p>
          </div>

          <div className="rounded-md bg-amber-950/20 border border-amber-800/40 p-3 text-xs text-amber-200/80 space-y-1">
            <p className="font-medium text-amber-300">Antes de configurar:</p>
            <p>Compartilhe esta pasta com a conta de serviço do sistema (Compartilhar → cole o e-mail da conta de serviço → Leitor).</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-md bg-white px-6 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            Salvar integrações
          </button>
          <Link
            href={`/clients/${id}`}
            className="rounded-md border border-zinc-700 px-6 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Voltar
          </Link>
        </div>
      </form>
    </div>
  )
}
