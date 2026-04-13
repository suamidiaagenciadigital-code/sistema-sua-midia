'use server'

import { redirect } from 'next/navigation'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type Classification = 'pedido' | 'queixa' | 'elogio' | 'duvida' | 'extra' | 'urgente'

export async function createTicketAction(formData: FormData) {
  const client_id = formData.get('client_id') as string
  const message = formData.get('message') as string

  if (!client_id || !message) return

  const supabase = await createClient()

  // Buscar nome do cliente para contexto
  const { data: client } = await supabase.from('clients').select('name, niche, tone_of_voice').eq('id', client_id).single()

  const clientContext = client
    ? `Cliente: ${client.name} | Nicho: ${client.niche} | Tom de voz da marca: ${client.tone_of_voice || 'profissional'}`
    : 'Cliente de agência de marketing digital'

  const prompt = `Você é um assistente de atendimento de uma agência de marketing digital chamada Sua Mídia.

${clientContext}

Mensagem recebida do cliente via WhatsApp:
"""
${message}
"""

Classifique esta mensagem em UMA das categorias:
- pedido: solicitação de conteúdo, artes, posts, vídeos ou serviços contratados
- queixa: reclamação, insatisfação, erro, problema ou crítica
- elogio: elogio, agradecimento, satisfação positiva
- duvida: pergunta, dúvida, pedido de informação
- extra: solicitação de serviço fora do contrato atual
- urgente: demanda urgente, prazo imediato, emergência

Responda EXATAMENTE neste JSON:
{
  "classification": "uma das categorias acima",
  "suggested_response": "resposta profissional e empática para enviar ao cliente via WhatsApp, no tom da marca, máximo 3 parágrafos curtos"
}`

  let classification: Classification = 'duvida'
  let suggested_response = ''

  try {
    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      classification = parsed.classification as Classification
      suggested_response = parsed.suggested_response ?? ''
    }
  } catch {
    // Se a IA falhar, cria o ticket sem classificação/sugestão
  }

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({
      client_id,
      original_message: message,
      classification,
      ai_suggested_response: suggested_response,
      status: 'open',
    })
    .select('id')
    .single()

  if (error || !ticket) {
    throw new Error('Erro ao criar ticket')
  }

  redirect(`/support/${ticket.id}`)
}
