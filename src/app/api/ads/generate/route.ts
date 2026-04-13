import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { Client } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { clientId, objective, budget, period } = await req.json()

  const supabase = await createClient()
  const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single()

  if (!client) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  }

  const c = client as Client

  const prompt = `Você é um especialista em tráfego pago e campanhas de anúncios Meta Ads (Facebook e Instagram) para agências de marketing digital.

## CLIENTE: ${c.name}
**Nicho:** ${c.niche}
**Público-alvo:** ${c.target_audience}
**Dores do público:** ${c.pain_points}
**Diferenciais:** ${c.differentials}
**Tom de voz:** ${c.tone_of_voice}
${c.ai_notes ? `**Observações estratégicas:** ${c.ai_notes}` : ''}

## CAMPANHA SOLICITADA
**Objetivo:** ${objective}
**Verba:** ${budget || 'não informada'}
**Período:** ${period || 'não informado'}

Crie uma estratégia completa de campanha de anúncios e responda EXATAMENTE neste JSON:
{
  "strategy": "estratégia completa em 3-5 parágrafos: estrutura de campanha, tipos de anúncio recomendados, distribuição de verba, funil, métricas esperadas",
  "copies": [
    {
      "label": "Versão A — Dor/Problema",
      "headline": "título do anúncio (máx 40 chars)",
      "body": "texto principal do anúncio (2-3 linhas, tom da marca)",
      "cta": "botão de CTA"
    },
    {
      "label": "Versão B — Solução/Benefício",
      "headline": "título alternativo",
      "body": "texto alternativo para teste A/B",
      "cta": "botão de CTA"
    }
  ],
  "audience_suggestion": "descrição detalhada do público para segmentação: interesses, comportamentos, faixa etária, localização, públicos semelhantes recomendados"
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    return NextResponse.json({ error: 'Resposta inválida da IA' }, { status: 500 })
  }

  return NextResponse.json(JSON.parse(jsonMatch[0]))
}
