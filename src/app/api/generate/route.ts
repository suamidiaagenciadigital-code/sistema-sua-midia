import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { Client } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildSystemPrompt(client: Client): string {
  const colors = client.brand_colors?.join(', ') || 'não definido'
  const keywords = client.brand_keywords?.join(', ') || 'não definido'
  const forbidden = client.forbidden_words?.join(', ') || 'nenhuma'

  return `Você é um estrategista de conteúdo especializado para redes sociais, trabalhando para a agência Sua Mídia.

## CLIENTE: ${client.name}
**Nicho:** ${client.niche}
**Slogan:** ${client.slogan || 'não definido'}

## PÚBLICO-ALVO
${client.target_audience}

## DORES DO PÚBLICO
${client.pain_points}

## DIFERENCIAIS
${client.differentials}

## TOM DE VOZ
${client.tone_of_voice}

## PALAVRAS-CHAVE DA MARCA
${keywords}

## PALAVRAS PROIBIDAS (NUNCA USE)
${forbidden}

## OBJETIVO DO MÊS
${client.monthly_goal}

## SERVIÇOS CONTRATADOS
${client.contracted_services}

${client.catalog ? `## CATÁLOGO\n${client.catalog}\n` : ''}
${client.ai_notes ? `## NOTAS ESTRATÉGICAS (REGRAS IMPORTANTES)\n${client.ai_notes}\n` : ''}

## IDENTIDADE VISUAL
- Cores: ${colors}
- Fontes: ${client.brand_fonts || 'não definido'}
- Estilo: ${client.visual_style || 'não definido'}
- Obrigatório: ${client.visual_mandatory || 'não definido'}
- Proibido: ${client.visual_forbidden || 'nenhum'}

## REGRAS GERAIS
- Sempre inclua um CTA claro
- Respeite rigorosamente as palavras proibidas
- Mantenha o tom de voz definido
- Adapte o conteúdo ao tipo solicitado (reel, carrossel, imagem, story)
- Para reels: gancho forte nos primeiros 2 segundos
- Para carrosseis: estrutura educativa ou comparativa
- Responda SEMPRE em JSON válido conforme o schema solicitado`
}

export async function POST(req: NextRequest) {
  const { clientId, type, theme } = await req.json()

  const supabase = await createClient()
  const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single()

  if (!client) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  }

  const typeInstructions: Record<string, string> = {
    reel: 'Crie um roteiro de Reel (vídeo vertical 9:16, ~30-60s). Gancho forte nos primeiros 2 segundos.',
    carrossel: 'Crie um Carrossel (5-8 slides). Estrutura educativa ou comparativa. Cada slide tem um título curto.',
    imagem: 'Crie conteúdo para uma imagem de feed (1:1 ou 4:5). Copy direta e impactante.',
    story: 'Crie conteúdo para um Story (9:16, efêmero). Tom mais leve e conversacional.',
  }

  const userPrompt = `Gere um conteúdo do tipo **${type}** para ${client.name}.
${theme ? `Tema/gancho sugerido: ${theme}` : 'Escolha um tema relevante baseado no perfil e objetivo do mês.'}

${typeInstructions[type] || ''}

Responda EXATAMENTE neste JSON:
{
  "title": "título resumido do conteúdo",
  "caption": "copy/legenda completa com emojis e NO MÁXIMO 5 hashtags relevantes",
  "script": "roteiro detalhado (para reels) ou estrutura de slides (para carrosseis) — null para imagem/story",
  "image_prompt": "prompt em inglês para geração de imagem com identidade visual do cliente",
  "cta": "call to action específico",
  "partner_mentioned": "nome do parceiro se relevante — null se não houver"
}

REGRA OBRIGATÓRIA: a legenda deve ter NO MÁXIMO 5 hashtags. Priorize as mais relevantes e de maior alcance para o nicho.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1500,
    system: buildSystemPrompt(client as Client),
    messages: [{ role: 'user', content: userPrompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  // Extrair JSON da resposta
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return NextResponse.json({ error: 'Resposta inválida da IA' }, { status: 500 })
  }

  const generated = JSON.parse(jsonMatch[0])

  // Montar prompt visual completo com identidade do cliente
  const visualSuffix = [
    client.visual_style === 'escuro' ? 'dark background, dramatic lighting' : '',
    client.brand_colors?.length ? `color palette: ${client.brand_colors.join(', ')}` : '',
    client.visual_mandatory || '',
  ].filter(Boolean).join(', ')

  if (visualSuffix) {
    generated.image_prompt = `${generated.image_prompt}, ${visualSuffix}`
  }

  return NextResponse.json(generated)
}
