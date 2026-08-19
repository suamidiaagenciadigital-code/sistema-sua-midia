'use client'

import { useState, useTransition } from 'react'
import { updateProposalAction } from '../../nova/actions'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Deliverable = { icon: string; title: string; description: string; qty: string }
type AvulsoItem = { name: string; price: string }
type AvulsoCategory = { category: string; items: AvulsoItem[] }

interface Props {
  proposal: {
    id: string
    client_name: string
    service_title: string
    service_description: string | null
    monthly_value: number
    whatsapp: string
    email: string
    valid_days: number
    deliverables: Deliverable[]
    avulsos: Array<{ category: string; items: Array<{ name: string; price: number }> }>
  }
}

export function EditPropostaForm({ proposal }: Props) {
  const [isPending, startTransition] = useTransition()

  const [clientName, setClientName]   = useState(proposal.client_name)
  const [serviceTitle, setServiceTitle] = useState(proposal.service_title)
  const [serviceDesc, setServiceDesc] = useState(proposal.service_description ?? '')
  const [monthlyValue, setMonthlyValue] = useState(String(proposal.monthly_value))
  const [whatsapp, setWhatsapp]       = useState(proposal.whatsapp)
  const [email, setEmail]             = useState(proposal.email)
  const [validDays, setValidDays]     = useState(String(proposal.valid_days))

  const [deliverables, setDeliverables] = useState<Deliverable[]>(
    (proposal.deliverables ?? []).map(d => ({ ...d }))
  )
  const [avulsos, setAvulsos] = useState<AvulsoCategory[]>(
    (proposal.avulsos ?? []).map(c => ({
      category: c.category,
      items: c.items.map(i => ({ name: i.name, price: String(i.price) })),
    }))
  )

  // Deliverables
  function updateDeliverable(i: number, field: keyof Deliverable, value: string) {
    setDeliverables(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d))
  }
  function removeDeliverable(i: number) { setDeliverables(prev => prev.filter((_, idx) => idx !== i)) }
  function addDeliverable() { setDeliverables(prev => [...prev, { icon: '📌', title: '', description: '', qty: '' }]) }

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
  function removeAvulsoCategory(ci: number) { setAvulsos(prev => prev.filter((_, i) => i !== ci)) }
  function addAvulsoCategory() { setAvulsos(prev => [...prev, { category: 'Nova categoria', items: [{ name: '', price: '' }] }]) }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const emptyTitle = deliverables.findIndex(d => !d.title.trim())
    if (emptyTitle !== -1) {
      alert(`O entregável #${emptyTitle + 1} está sem título. Preencha antes de salvar.`)
      return
    }
    const avulsosFormatted = avulsos
      .map(c => ({ category: c.category, items: c.items.filter(it => it.name).map(it => ({ name: it.name, price: parseFloat(it.price) || 0 })) }))
      .filter(c => c.items.length > 0)

    const fd = new FormData(e.currentTarget)
    fd.set('deliverables_json', JSON.stringify(deliverables))
    fd.set('avulsos_json', JSON.stringify(avulsosFormatted))

    startTransition(() => { updateProposalAction(proposal.id, fd) })
  }

  const inputCls = 'w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500'
  const labelCls = 'block text-xs font-medium text-zinc-400 mb-1.5'

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/propostas/preview/${proposal.id}`} className="text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-white text-2xl font-bold">Editar proposta</h1>
          <p className="text-zinc-400 text-sm mt-0.5">{proposal.client_name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Dados do cliente */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Dados do cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nome da empresa *</label>
              <input name="client_name" value={clientName} onChange={e => setClientName(e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>WhatsApp de contato *</label>
              <input name="whatsapp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>E-mail de contato</label>
            <input name="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
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
              <input name="monthly_value" value={monthlyValue} onChange={e => setMonthlyValue(e.target.value)} required type="number" step="0.01" min="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Validade (dias)</label>
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
                  <input value={d.title} onChange={e => updateDeliverable(i, 'title', e.target.value)} className={inputCls + ' flex-1'} placeholder="Título" style={{ color: 'white' }} />
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
            {isPending ? 'Salvando...' : '💾 Salvar alterações'}
          </button>
          <Link href={`/propostas/preview/${proposal.id}`} className="px-6 py-3 rounded-xl text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 text-sm transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
