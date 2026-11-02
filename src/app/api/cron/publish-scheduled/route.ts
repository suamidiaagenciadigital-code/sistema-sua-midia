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

  // Aprovação automática: post que o cliente recebeu ("Enviado ao cliente") e não
  // aprovou até 30 min antes do horário é aprovado aqui; a publicação em si sai
  // no horário, pelo passo abaixo. Post em "Revisar" (o cliente pediu correção) e
  // rascunho (o cliente nem recebeu) não entram. Só olha as últimas 24 h para não
  // aprovar post velho que ficou esquecido.
  const AUTO_APPROVE_MIN = 30
  const yesterday = new Date(brasiliaTime.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const tomorrow = new Date(brasiliaTime.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  let autoApproved = 0
  const { data: pendingApproval } = await supabase
    .from('contents')
    .select('id, scheduled_date, scheduled_time')
    .eq('status', 'sent_to_client')
    .not('scheduled_date', 'is', null)
    .gte('scheduled_date', yesterday)
    .lte('scheduled_date', tomorrow)
  for (const c of pendingApproval ?? []) {
    const at = Date.parse(`${c.scheduled_date}T${((c.scheduled_time as string | null) ?? '00:00').slice(0, 5)}:00-03:00`)
    if (Number.isNaN(at)) continue
    const msLeft = at - now.getTime()
    if (msLeft > AUTO_APPROVE_MIN * 60 * 1000 || msLeft < -24 * 60 * 60 * 1000) continue
    // Condicional no status: se o cliente aprovar ou pedir revisão nesse instante, ele ganha.
    let upd = await supabase
      .from('contents')
      .update({ status: 'approved_by_client', auto_approved: true })
      .eq('id', c.id)
      .eq('status', 'sent_to_client')
      .select('id')
    // Coluna auto_approved ainda não existe (migration_v21 pendente): aprova sem a marca
    if (upd.error) {
      upd = await supabase
        .from('contents')
        .update({ status: 'approved_by_client' })
        .eq('id', c.id)
        .eq('status', 'sent_to_client')
        .select('id')
    }
    if (upd.data && upd.data.length > 0) {
      autoApproved++
      console.log(`[cron] Aprovação automática: ${c.id} (${c.scheduled_date} ${c.scheduled_time})`)
    }
  }

  // Stories entram "Agendado" (não vão para a página do cliente): na aprovação
  // manual são liberados quando o cliente aprova um post do mesmo dia (ver
  // /api/public-approval). Aqui seguem o mesmo prazo do feed: 30 min antes do
  // horário, a menos que o cliente tenha pedido revisão de algo daquele dia.
  const { data: pendingStories } = await supabase
    .from('contents')
    .select('id, client_id, scheduled_date, scheduled_time')
    .eq('type', 'story')
    .eq('status', 'scheduled')
    .not('scheduled_date', 'is', null)
    .gte('scheduled_date', yesterday)
    .lte('scheduled_date', tomorrow)
  const dueStories = (pendingStories ?? []).filter((s) => {
    const at = Date.parse(`${s.scheduled_date}T${((s.scheduled_time as string | null) ?? '00:00').slice(0, 5)}:00-03:00`)
    if (Number.isNaN(at)) return false
    const msLeft = at - now.getTime()
    return msLeft <= AUTO_APPROVE_MIN * 60 * 1000 && msLeft >= -24 * 60 * 60 * 1000
  })
  if (dueStories.length > 0) {
    const { data: revisions } = await supabase
      .from('contents')
      .select('client_id, scheduled_date')
      .eq('status', 'revision')
      .in('scheduled_date', [...new Set(dueStories.map((s) => s.scheduled_date as string))])
    const held = new Set((revisions ?? []).map((r) => `${r.client_id}|${r.scheduled_date}`))
    for (const s of dueStories) {
      if (held.has(`${s.client_id}|${s.scheduled_date}`)) continue
      let upd = await supabase
        .from('contents')
        .update({ status: 'approved_by_client', auto_approved: true })
        .eq('id', s.id)
        .eq('status', 'scheduled')
        .select('id')
      if (upd.error) {
        upd = await supabase
          .from('contents')
          .update({ status: 'approved_by_client' })
          .eq('id', s.id)
          .eq('status', 'scheduled')
          .select('id')
      }
      if (upd.data && upd.data.length > 0) {
        autoApproved++
        console.log(`[cron] Aprovação automática (story): ${s.id} (${s.scheduled_date} ${s.scheduled_time})`)
      }
    }
  }

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
    return NextResponse.json({ ok: true, checked: 0, published: 0, autoApproved })
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
    return NextResponse.json({ ok: true, checked: candidates.length, published: 0, autoApproved })
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
        // "Claim" atômico: só segue se conseguir tirar o conteúdo de
        // approved_by_client. Protege contra duas execuções concorrentes do
        // cron (ex: retry por timeout do cron-job.org) publicarem o mesmo
        // post duas vezes — o UPDATE condicional é resolvido pelo banco,
        // então só uma das duas chamadas ganha a corrida.
        const { data: claimed } = await supabase
          .from('contents')
          .update({ status: 'published' })
          .eq('id', content.id)
          .eq('status', 'approved_by_client')
          .select('id')

        if (!claimed || claimed.length === 0) {
          console.log(`[cron] ${content.id} já foi reivindicado por outra execução — pulando`)
          return { id: content.id, ok: false, skipped: 'already claimed' }
        }

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
    autoApproved,
    results,
  })
}
