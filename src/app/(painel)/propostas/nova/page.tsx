'use client'

import { useState, useTransition } from 'react'
import { createProposalAction } from './actions'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

type Deliverable = { icon: string; title: string; description: string; qty: string }
type AvulsoItem = { name: string; price: string }
type AvulsoCategory = { category: string; items: AvulsoItem[] }

const DEFAULT_DELIVERABLES: Deliverable[] = [
  { icon: '🎠', title: 'Carrossel', description: 'Posts educativos e informativos em formato carrossel para engajar e educar seu público.', qty: '4/mês' },
  { icon: '🎬', title: 'Reel', description: 'Vídeos curtos e dinâmicos para Instagram e Facebook com maior alcance orgânico.', qty: '4/mês' },
  { icon: '📷', title: 'Post Estático', description: 'Imagens institucionais, promocionais e de relacionamento com identidade visual da marca.', qty: '4/mês' },
  { icon: '📲', title: 'Story', description: 'Stories diários para manter presença constante e engajamento com seguidores.', qty: 'Diário' },
]

const DEFAULT_AVULSOS: AvulsoCategory[] = [
  { category: 'Publicações extras', items: [
    { name: 'Vídeo/Reel extra', price: '200' },
    { name: 'Carrossel extra', price: '150' },
    { name: 'Post estático extra', price: '100' },
  ]},
  { category: 'Tráfego pago', items: [
    { name: 'Gestão Meta Ads (+ verba)', price: '300' },
    { name: 'Gestão Google Ads (+ verba)', price: '350' },
  ]},
  { category: 'Identidade visual', items: [
    { name: 'Logotipo profissional', price: '800' },
    { name: 'Manual de marca completo', price: '1200' },
  ]},
]

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function NovaPropostaPage() {
  const [isPending, startTransition] = useTransition()

  const [clientName, setClientName] = useState('')
  const [slug, setSlug] = useState('')
  const [serviceTitle, setServiceTitle] = useState('Gestão de Redes Sociais')
  const [serviceDesc, setServiceDesc] = useState('Produção completa de conteúdo para redes sociais, com estratégia, criação e publicação.')
  const [monthlyValue, setMonthlyValue] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('contato@suamidia.com')
  const [validDays, setValidDays] = useState('15')

  const [deliverables, setDeliverables] = useState<Deliverable[]>(DEFAULT_DELIVERABLES)
  const [avulsos, setAvulsos] = useState<AvulsoCategory[]>(DEFAULT_AVULSOS)

  function handleClientNameChange(v: string) {
    setClientName(v)
    setSlug(slugify(v))
  }

  // Deliverables
  function updateDeliverable(i: number, field: keyof Deliverable, value: string) {
    setDeliverables(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d))
  }
  function removeDeliverable(i: number) {
    setDeliverables(prev => prev.filter((_, idx) => idx !== i))
  }
  function addDeliverable() {
    setDeliverables(prev => [...prev, { icon: '📌', title: '', description: '', qty: '' }])
  }

  // Avulsos
  function updateCategoryName(ci: number, value: string) {
    setAvulsos(prev => prev.map((c, i) => i === ci ? { ...c, category: value } : c))
  }
  function updateAvulsoItem(ci: number, ii: number, field: keyof AvulsoItem, value: string) {
    setAvulsos(prev => prev.map((c, i) => i !== ci ? c : {
      ...c, items: c.items.map((item, j) => j === ii ? { ...item, [field]: value } : item)
    }))
  }
  function removeAvulsoItem(ci: number, ii: number) {
    setAvulsos(prev => prev.map((c, i) => i !== ci ? c : { ...c, items: c.items.filter((_, j) => j !== ii) }))
  }
  function addAvulsoItem(ci: number) {
    setAvulsos(prev => prev.map((c, i) => i !== ci ? c : { ...c, items: [...c.items, { name: '', price: '' }] }))
  }
  function removeAvulsoCategory(ci: number) {
    setAvulsos(prev => prev.filter((_, i) => i !== ci))
  }
  function addAvulsoCategory() {
    setAvulsos(prev => [...prev, { category: 'Nova categoria', items: [{ name: '', price: '' }] }])
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const avulsosFormatted = avulsos.map(c => ({
      category: c.category,
      items: c.items.filter(it => it.name).map(it => ({ name: it.name, price: parseFloat(it.price) || 0 }))
    })).filter(c => c.items.length > 0)

    const fd = new FormData(e.currentTarget)
    fd.set('deliverables_json', JSON.stringify(deliverables))
    fd.set('avulsos_json', JSON.stringify(avulsosFormatted))

    startTransition(() => { createProposalAction(fd) })
  }

  const inputCls = 'w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500'
  const labelCls = 'block text-xs font-medium text-zinc-400 mb-1.5'

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold">Nova proposta</h1>
        <p className="text-zinc-400 text-sm mt-1">Preencha os dados para gerar a proposta comercial</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Dados básicos */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Dados do cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nome da empresa *</label>
              <input name="client_name" value={clientName} onChange={e => handleClientNameChange(e.target.value)} required placeholder="Nortec Infra" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Slug da URL *</label>
              <div className="flex items-center gap-1">
                <span className="text-zinc-600 text-xs whitespace-nowrap">/propostas/</span>
                <input name="slug" value={slug} onChange={e => setSlug(e.target.value)} required placeholder="nortec-infra" className={inputCls} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>WhatsApp de contato *</label>
              <input name="whatsapp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required placeholder="+55 62 99999-9999" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>E-mail de contato</label>
              <input name="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contato@suamidia.com" className={inputCls} />
            </div>
          </div>
        </section>

        {/* Serviço e valor */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Serviço & Investimento</h2>
          <div>
            <label className={labelCls}>Título do serviço *</label>
            <input name="service_title" value={serviceTitle} onChange={e => setServiceTitle(e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Descrição do serviço</label>
            <textarea name="service_description" value={serviceDesc} onChange={e => setServiceDesc(e.target.value)} rows={2} className={inputCls + ' resize-none'} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Valor mensal (R$) *</label>
              <input name="monthly_value" value={monthlyValue} onChange={e => setMonthlyValue(e.target.value)} required placeholder="1200" type="number" step="0.01" min="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Validade da proposta (dias)</label>
              <input name="valid_days" value={validDays} onChange={e => setValidDays(e.target.value)} type="number" min="1" max="365" className={inputCls} />
            </div>
          </div>
        </section>

        {/* Entregáveis */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Entregáveis</h2>
            <button type="button" onClick={addDeliverable} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
              <Plus className="h-3.5 w-3.5" /> Adicionar
            </button>
          </div>
          <div className="space-y-3">
            {deliverables.map((d, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input value={d.icon} onChange={e => updateDeliverable(i, 'icon', e.target.value)} className={inputCls + ' w-10 text-center text-lg shrink-0'} placeholder="🎠" maxLength={4} />
                  <input value={d.title} onChange={e => updateDeliverable(i, 'title', e.target.value)} className={inputCls + ' flex-1'} placeholder="Título" />
                  <input value={d.qty} onChange={e => updateDeliverable(i, 'qty', e.target.value)} className={inputCls + ' w-20 shrink-0'} placeholder="4/mês" />
                  <button type="button" onClick={() => removeDeliverable(i)} className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-zinc-700 text-zinc-600 hover:text-red-400 hover:border-red-900/50 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input value={d.description} onChange={e => updateDeliverable(i, 'description', e.target.value)} className={inputCls} placeholder="Descrição" />
              </div>
            ))}
          </div>
        </section>

        {/* Avulsos */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Avulsos & Extras</h2>
            <button type="button" onClick={addAvulsoCategory} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
              <Plus className="h-3.5 w-3.5" /> Categoria
            </button>
          </div>
          <div className="space-y-4">
            {avulsos.map((cat, ci) => (
              <div key={ci} className="border border-zinc-800 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 bg-zinc-900 px-3 py-2 border-b border-zinc-800">
                  <input value={cat.category} onChange={e => updateCategoryName(ci, e.target.value)} className="flex-1 bg-transparent text-sm font-medium text-zinc-300 focus:outline-none" />
                  <button type="button" onClick={() => addAvulsoItem(ci)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <Plus className="h-3 w-3" /> item
                  </button>
                  <button type="button" onClick={() => removeAvulsoCategory(ci)} className="text-zinc-600 hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="p-3 space-y-2">
                  {cat.items.map((item, ii) => (
                    <div key={ii} className="grid grid-cols-[1fr_80px_36px] sm:grid-cols-[1fr_100px_36px] gap-2">
                      <input value={item.name} onChange={e => updateAvulsoItem(ci, ii, 'name', e.target.value)} className={inputCls} placeholder="Nome do serviço" />
                      <input value={item.price} onChange={e => updateAvulsoItem(ci, ii, 'price', e.target.value)} className={inputCls} placeholder="R$ 0" type="number" min="0" />
                      <button type="button" onClick={() => removeAvulsoItem(ci, ii)} className="h-9 w-9 flex items-center justify-center rounded-lg border border-zinc-700 text-zinc-600 hover:text-red-400 hover:border-red-900/50 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Submit */}
        <div className="flex gap-3 pb-8">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 transition-opacity"
            style={{ background: 'linear-gradient(to right, #2B80FF, #A855F7)' }}
          >
            {isPending ? 'Gerando...' : '✨ Gerar proposta'}
          </button>
          <a href="/propostas" className="px-6 py-3 rounded-xl text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 text-sm transition-colors">
            Cancelar
          </a>
        </div>
      </form>
    </div>
  )
}
