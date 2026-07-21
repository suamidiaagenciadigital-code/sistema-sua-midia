import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Cron Job — chamado diariamente às 11:10 BRT (14:10 UTC)
// Publica automaticamente conteúdos aprovados cujo scheduled_date+time já passou
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Vercel envia Authorization: Bearer {CRON_SECRET} automaticamente
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Horário atual em Brasília (UTC-3, sem horário de verão desde 2019)
  const now = new Date()
  const brasiliaTime = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  const todayDate = brasiliaTime.toISOString().split('T')[0]        // YYYY-MM-DD
  const currentTime = brasiliaTime.toISOString().split('T')[1].slice(0, 5) // HH:MM

  // Janela de 7 dias: evita publicar backlog acumulado de semanas anteriores
  const sevenDaysAgo = new Date(brasiliaTime.getTime() - 7 * 24 * 60 * 60 * 1000)
  const sevenDaysAgoDate = sevenDaysAgo.toISOString().split('T')[0]

  // Buscar aprovados dentro dos últimos 7 dias (filtra horário no JS)
  const { data: candidates, error: dbError } = await supabase
    .from('contents')
    .select('id, scheduled_date, scheduled_time, client_id')
    .eq('status', 'approved_by_client')
    .not('scheduled_date', 'is', null)
    .lte('scheduled_date', todayDate)
    .gte('scheduled_date', sevenDaysAgoDate)

  if (dbError) {
    console.error('[cron] Erro ao buscar conteúdos:', dbError.message)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ ok: true, checked: 0, published: 0 })
  }

  // Filtrar os que a hora já chegou
  const toPublish = candidates.filter((c) => {
    if (!c.scheduled_date) return false
    if (c.scheduled_date < todayDate) return true               // data passada
    if (c.scheduled_date === todayDate) {
      const time = (c.scheduled_time as string | null) ?? '00:00'
      return time <= currentTime                                  // hoje, hora chegou
    }
    return false
  })

  if (toPublish.length === 0) {
    return NextResponse.json({ ok: true, checked: candidates.length, published: 0 })
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null) ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  // Publica todos em paralelo — mais rápido e dentro do limite de timeout do plano
  const results = await Promise.all(
    toPublish.map(async (content) => {
      try {
        console.log(`[cron] Publicando ${content.id} (${content.scheduled_date} ${content.scheduled_time})`)
        const resp = await fetch(`${baseUrl}/api/contents/${content.id}/publish-now`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cron-secret': process.env.CRON_SECRET ?? '',
          },
          body: JSON.stringify({}),
        })
        const data = await resp.json().catch(() => ({}))
        console.log(`[cron] Resultado ${content.id}:`, JSON.stringify(data))
        return { id: content.id, ok: data.ok ?? false, facebook: data.facebook, instagram: data.instagram }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error(`[cron] Erro ${content.id}:`, msg)
        return { id: content.id, ok: false, error: msg }
      }
    })
  )

  return NextResponse.json({
    ok: true,
    checked: candidates.length,
    published: toPublish.length,
    results,
  })
}
