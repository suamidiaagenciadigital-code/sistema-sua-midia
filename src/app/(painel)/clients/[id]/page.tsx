import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateClientAction } from './actions'
import { DeleteClientButton } from './delete-button'
import { DispatchApprovalButton } from './dispatch-approval-button'
import { ChevronLeft, Sparkles, Plug, ImagePlay } from 'lucide-react'
import { Client } from '@/lib/types'
import { ImportClientProfileButton } from '../import-profile-button'

interface Props {
  params: Promise<{ id: string }>
}

function Field({
  label, name, value, required, type = 'text', hint, options, rows = 3
}: {
  label: string; name: string; value?: string | null; required?: boolean
  type?: 'text' | 'textarea' | 'select'; hint?: string
  options?: { value: string; label: string }[]; rows?: number
}) {
  const base = "w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
  return (
    <div className="space-y-1">
      <label className="text-sm text-zinc-300 font-medium">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea name={name} required={required} rows={rows} defaultValue={value ?? ''} className={base} />
      ) : type === 'select' ? (
        <select name={name} required={required} defaultValue={value ?? ''} className={base}>
          {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type="text" name={name} required={required} defaultValue={value ?? ''} className={base} />
      )}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-white border-b border-zinc-800 pb-2">{title}</h2>
      {children}
    </div>
  )
}

export default async function ClientPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: client } = await supabase.from('clients').select('*').eq('id', id).single()

  if (!client) notFound()

  const c = client as Client

  const update = updateClientAction.bind(null, id)

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/clients" className="text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{c.name}</h1>
            <p className="text-zinc-400 text-sm mt-0.5">{c.niche}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/clients/${id}/stories/new`}
            className="flex items-center gap-2 rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
          >
            <ImagePlay className="h-4 w-4" />
            Story
          </Link>
          <Link
            href={`/clients/${id}/content/new`}
            className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Gerar conteúdo
          </Link>
        </div>
      </div>

      <ImportClientProfileButton />

      <form action={update} className="space-y-8">
        <Section title="Identidade do negócio">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome" name="name" value={c.name} required />
            <Field label="Nicho / Segmento" name="niche" value={c.niche} required />
          </div>
          <Field label="Slogan / Manifesto" name="slogan" value={c.slogan} type="textarea" rows={2} />
          <Field label="Status" name="status" value={c.status} type="select"
            options={[
              { value: 'ativo', label: 'Ativo' },
              { value: 'pausado', label: 'Pausado' },
              { value: 'encerrado', label: 'Encerrado' },
            ]}
          />
        </Section>

        <Section title="Público e posicionamento">
          <Field label="Público-alvo" name="target_audience" value={c.target_audience} required type="textarea" rows={2} />
          <Field label="Dores do público" name="pain_points" value={c.pain_points} required type="textarea" rows={3} />
          <Field label="Diferenciais" name="differentials" value={c.differentials} required type="textarea" rows={3} />
        </Section>

        <Section title="Tom de voz e linguagem">
          <Field label="Tom de voz" name="tone_of_voice" value={c.tone_of_voice} required type="textarea" rows={3} />
          <Field label="Palavras-chave da marca" name="brand_keywords"
            value={c.brand_keywords?.join(', ')}
            hint="Separe por vírgula" />
          <Field label="Palavras PROIBIDAS" name="forbidden_words"
            value={c.forbidden_words?.join(', ')}
            hint="Separe por vírgula" />
        </Section>

        <Section title="Contrato e operação">
          <Field label="Objetivo do mês" name="monthly_goal" value={c.monthly_goal} required type="textarea" rows={2} />
          <Field label="Serviços contratados" name="contracted_services" value={c.contracted_services} required type="textarea" rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Orçamento de anúncios" name="ad_budget" value={c.ad_budget} />
            <Field label="Limite de alterações" name="revision_limit" value={c.revision_limit} />
          </div>
          <Field label="Métricas de sucesso" name="success_metrics" value={c.success_metrics} type="textarea" rows={2} />
          <Field label="Valores extras" name="extra_values" value={c.extra_values} type="textarea" rows={2} />
        </Section>

        <Section title="Catálogo e notas para IA">
          <Field label="Catálogo de serviços/produtos" name="catalog" value={c.catalog} type="textarea" rows={4} />
          <Field label="Notas estratégicas para a IA" name="ai_notes" value={c.ai_notes} type="textarea" rows={4} />
        </Section>

        <Section title="Identidade visual">
          <Field label="Referências visuais" name="visual_references" value={c.visual_references} type="textarea" rows={2} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Cores da marca (hex)" name="brand_colors"
              value={c.brand_colors?.join(', ')} hint="Separe por vírgula" />
            <Field label="Fontes da marca" name="brand_fonts" value={c.brand_fonts} />
          </div>
          <Field label="Estilo visual" name="visual_style" value={c.visual_style ?? ''} type="select"
            options={[
              { value: '', label: 'Não definido' },
              { value: 'escuro', label: 'Escuro' },
              { value: 'claro', label: 'Claro' },
              { value: 'colorido', label: 'Colorido' },
              { value: 'minimalista', label: 'Minimalista' },
            ]}
          />
          <Field label="Elementos visuais obrigatórios" name="visual_mandatory" value={c.visual_mandatory} type="textarea" rows={2} />
          <Field label="Elementos visuais proibidos" name="visual_forbidden" value={c.visual_forbidden} type="textarea" rows={2} />
        </Section>

        <div className="flex gap-3 pt-2">
          <button type="submit"
            className="rounded-md bg-white px-6 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors">
            Salvar alterações
          </button>
          <Link href="/clients"
            className="rounded-md border border-zinc-700 px-6 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Cancelar
          </Link>
        </div>
      </form>

      <DispatchApprovalButton clientId={id} approvalToken={c.approval_token ?? null} />

      {/* Integrações Meta */}
      <Link
        href={`/clients/${id}/integrations`}
        className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-4 hover:border-zinc-600 hover:bg-zinc-800/50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center transition-colors">
            <Plug className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Integrações — Meta Business</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {(c.facebook_page_id && c.instagram_account_id)
                ? '✓ Facebook e Instagram configurados'
                : c.facebook_page_id
                ? '✓ Facebook · Instagram pendente'
                : 'Facebook e Instagram não configurados'}
            </p>
          </div>
        </div>
        <ChevronLeft className="h-4 w-4 text-zinc-500 rotate-180" />
      </Link>

      {/* Zona de perigo */}
      <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-red-400">Zona de perigo</h3>
        <p className="text-xs text-zinc-500">Excluir o cliente remove permanentemente o perfil e todo o conteúdo associado.</p>
        <DeleteClientButton id={id} />
      </div>
    </div>
  )
}
