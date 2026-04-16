import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ImportContent {
  title: string
  type: string
  caption?: string | null
  script?: string | null
  image_prompt?: string | null
  cta?: string | null
  partner_mentioned?: string | null
  scheduled_date?: string | null
  reel_scenes?: unknown[] | null
  carousel_cards?: unknown[] | null
}

interface ImportPayload {
  client_name?: string
  month?: string
  contents: ImportContent[]
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Verificar sessão
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { clientId, payload }: { clientId: string; payload: ImportPayload } = await req.json()

  if (!clientId || !payload?.contents?.length) {
    return NextResponse.json({ error: 'clientId e contents são obrigatórios' }, { status: 400 })
  }

  // Verificar que o cliente existe
  const { data: client } = await supabase.from('clients').select('id').eq('id', clientId).single()
  if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  const validTypes = ['imagem', 'reel', 'story', 'carrossel']

  const rows = payload.contents
    .filter(c => c.title && validTypes.includes(c.type))
    .map(c => ({
      client_id: clientId,
      status: 'draft',
      title: c.title,
      type: c.type,
      caption: c.caption ?? null,
      script: c.script ?? null,
      image_prompt: c.image_prompt ?? null,
      cta: c.cta ?? null,
      partner_mentioned: c.partner_mentioned ?? null,
      scheduled_date: c.scheduled_date ?? null,
      reel_scenes: c.reel_scenes ?? null,
      carousel_cards: c.carousel_cards ?? null,
    }))

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Nenhum conteúdo válido no arquivo' }, { status: 400 })
  }

  const { error } = await supabase.from('contents').insert(rows)

  if (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Erro ao importar conteúdos' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, imported: rows.length })
}
