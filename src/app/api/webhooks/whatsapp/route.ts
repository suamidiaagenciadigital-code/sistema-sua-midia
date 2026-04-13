import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Chamado pelo n8n quando uma mensagem nova chega no WhatsApp
// Body esperado: { phone: string, message: string, client_id?: string }
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { phone, message, client_id } = await req.json()

  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  const supabase = await createClient()

  // Se não vier client_id, tenta encontrar pelo telefone
  let resolvedClientId = client_id
  if (!resolvedClientId && phone) {
    const { data: clients } = await supabase.from('clients').select('id, locations').eq('status', 'ativo')
    for (const c of clients ?? []) {
      const locations = c.locations as any[]
      if (locations?.some(l => l.whatsapp?.replace(/\D/g, '') === phone.replace(/\D/g, ''))) {
        resolvedClientId = c.id
        break
      }
    }
  }

  if (!resolvedClientId) {
    // Não foi possível identificar o cliente — retorna aviso para o n8n tratar
    return NextResponse.json({ error: 'Cliente não identificado', phone, client_resolved: false }, { status: 422 })
  }

  // Classificar com IA
  const { data: client } = await supabase.from('clients').select('name, niche, tone_of_voice').eq('id', resolvedClientId).single()

  let classification = 'duvida'
  let suggested_response = ''

  try {
    const clientContext = client
      ? `Cliente: ${client.name} | Nicho: ${client.niche}`
      : 'Cliente de agência de marketing digital'

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 600,
      messages: [{
        role: 'user', content: `${clientContext}\n\nMensagem:\n"""${message}"""\n\nClassifique e responda em JSON:\n{"classification":"pedido|queixa|elogio|duvida|extra|urgente","suggested_response":"resposta profissional curta"}`
      }],
    })

    const text = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : ''
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      classification = parsed.classification
      suggested_response = parsed.suggested_response ?? ''
    }
  } catch {
    // IA falhou, ticket criado sem classificação
  }

  const { data: ticket } = await supabase
    .from('support_tickets')
    .insert({
      client_id: resolvedClientId,
      original_message: message,
      classification,
      ai_suggested_response: suggested_response,
      status: 'open',
    })
    .select('id')
    .single()

  return NextResponse.json({ ticket_id: ticket?.id, classification, client_resolved: true })
}
