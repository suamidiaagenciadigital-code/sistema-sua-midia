import Link from 'next/link'
import { createClientAction } from './actions'
import { ChevronLeft } from 'lucide-react'

interface FieldProps {
  label: string
  name: string
  required?: boolean
  type?: 'text' | 'textarea' | 'select'
  placeholder?: string
  hint?: string
  options?: { value: string; label: string }[]
  rows?: number
}

function Field({ label, name, required, type = 'text', placeholder, hint, options, rows = 3 }: FieldProps) {
  const base = "w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
  return (
    <div className="space-y-1">
      <label className="text-sm text-zinc-300 font-medium">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea name={name} required={required} placeholder={placeholder} rows={rows} className={base} />
      ) : type === 'select' ? (
        <select name={name} required={required} className={base}>
          {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type="text" name={name} required={required} placeholder={placeholder} className={base} />
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

export default function NewClientPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/clients" className="text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Novo cliente</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Preencha o perfil-base para a IA gerar conteúdo</p>
        </div>
      </div>

      <form action={createClientAction} className="space-y-8">
        <Section title="Identidade do negócio">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome do cliente" name="name" required placeholder="Ex: Don Barbearia" />
            <Field label="Nicho / Segmento" name="niche" required placeholder="Ex: Barbearia masculina premium" />
          </div>
          <Field label="Slogan / Manifesto" name="slogan" type="textarea" rows={2} placeholder="Ex: Viva a vida como um Don." />
          <Field
            label="Status"
            name="status"
            type="select"
            options={[
              { value: 'ativo', label: 'Ativo' },
              { value: 'pausado', label: 'Pausado' },
              { value: 'encerrado', label: 'Encerrado' },
            ]}
          />
        </Section>

        <Section title="Público e posicionamento">
          <Field label="Público-alvo" name="target_audience" required type="textarea" rows={2}
            placeholder="Ex: Homens 22-45 anos, classes B/A, Goiânia. Valorizam estilo e experiências premium." />
          <Field label="Dores do público" name="pain_points" required type="textarea" rows={3}
            placeholder="Liste as principais dores e frustrações do público..." />
          <Field label="Diferenciais" name="differentials" required type="textarea" rows={3}
            placeholder="O que torna esse cliente único no mercado?" />
        </Section>

        <Section title="Tom de voz e linguagem">
          <Field label="Tom de voz" name="tone_of_voice" required type="textarea" rows={3}
            placeholder="Descreva como a marca se comunica: formal, descontraído, com humor, técnico..." />
          <Field label="Palavras-chave da marca" name="brand_keywords"
            hint="Separe por vírgula: Ex: estilo, atitude, lifestyle, contemporâneo"
            placeholder="estilo, atitude, lifestyle" />
          <Field label="Palavras PROIBIDAS" name="forbidden_words"
            hint="Separe por vírgula: palavras que a IA nunca deve usar"
            placeholder="promoção, baratinho, aproveite" />
        </Section>

        <Section title="Contrato e operação">
          <Field label="Objetivo do mês" name="monthly_goal" required type="textarea" rows={2}
            placeholder="Ex: Aumentar agendamentos online em 30%, divulgar pacotes..." />
          <Field label="Serviços contratados" name="contracted_services" required type="textarea" rows={3}
            placeholder="Ex: 6 publicações/semana (2 reels + 1 carrossel + 3 imagens), video maker 1x/mês..." />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Orçamento de anúncios" name="ad_budget" placeholder="Ex: R$500/mês Google Ads" />
            <Field label="Limite de alterações" name="revision_limit" placeholder="Ex: 2 rodadas de revisão" />
          </div>
          <Field label="Métricas de sucesso" name="success_metrics" type="textarea" rows={2}
            placeholder="Ex: Agendamentos via link, seguidores, alcance..." />
          <Field label="Valores extras" name="extra_values" type="textarea" rows={2}
            placeholder="Ex: Post adicional R$50, Story extra R$40..." />
        </Section>

        <Section title="Catálogo e notas para IA">
          <Field label="Catálogo de serviços/produtos" name="catalog" type="textarea" rows={4}
            placeholder="Liste os serviços, produtos e preços que podem ser divulgados..." />
          <Field label="Notas estratégicas para a IA" name="ai_notes" type="textarea" rows={4}
            placeholder="Regras especiais, contextos importantes, instruções que a IA deve sempre seguir para este cliente..." />
        </Section>

        <Section title="Identidade visual">
          <Field label="Referências visuais" name="visual_references" type="textarea" rows={2}
            placeholder="Ex: Tons escuros, preto e dourado, estética cinematográfica..." />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Cores da marca (hex)" name="brand_colors"
              hint="Separe por vírgula: Ex: #1A1A1A, #D4AF37"
              placeholder="#1A1A1A, #D4AF37" />
            <Field label="Fontes da marca" name="brand_fonts"
              placeholder="Ex: Títulos: Montserrat Bold / Corpo: Open Sans" />
          </div>
          <Field
            label="Estilo visual"
            name="visual_style"
            type="select"
            options={[
              { value: '', label: 'Não definido' },
              { value: 'escuro', label: 'Escuro' },
              { value: 'claro', label: 'Claro' },
              { value: 'colorido', label: 'Colorido' },
              { value: 'minimalista', label: 'Minimalista' },
            ]}
          />
          <Field label="Elementos visuais obrigatórios" name="visual_mandatory" type="textarea" rows={2}
            placeholder="Ex: Logo sempre no canto inferior direito, borda dourada..." />
          <Field label="Elementos visuais proibidos" name="visual_forbidden" type="textarea" rows={2}
            placeholder="Ex: Nunca fundo branco, nunca fontes script..." />
        </Section>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-md bg-white px-6 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            Salvar cliente
          </button>
          <Link
            href="/clients"
            className="rounded-md border border-zinc-700 px-6 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
