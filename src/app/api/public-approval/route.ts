import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getMetaToken } from '@/lib/meta-token'

export async function POST(req: NextRequest) {
  const { contentId, token, status, revisionNotes } = await req.json()

  if (!['approved_by_client', 'revision'].includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Verificar que o token pertence ao cliente dono do conteúdo
  const { data: content } = await supabase
    .from('contents')
    .select('id, client_id, status, type, caption, generated_image_url, media_urls, scheduled_date, scheduled_time')
    .eq('id', contentId)
    .single()

  if (!content || content.status !== 'sent_to_client') {
    return NextResponse.json({ error: 'Conteúdo não encontrado ou já processado' }, { status: 404 })
  }

  const { data: client } = await supabase
    .from('clients')
    .select('approval_token, facebook_page_id, facebook_page_token, instagram_account_id')
    .eq('id', content.client_id)
    .single()

  if (!client || client.approval_token !== token) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 403 })
  }

  // Atualizar status do conteúdo
  const update: Record<string, unknown> = { status }
  if (revisionNotes) {
    update.revision_notes = revisionNotes
    const { data: current } = await supabase.from('contents').select('revision_count').eq('id', contentId).single()
    update.revision_count = (current?.revision_count ?? 0) + 1
  }

  await supabase.from('contents').update(update).eq('id', contentId)

  // ── Auto-aprovar stories do mesmo dia ────────────────────────────────────
  // Quando o cliente aprova um post do feed, os stories agendados para o mesmo
  // dia são automaticamente aprovados (não precisam aparecer na tela do cliente).
  if (status === 'approved_by_client' && content.scheduled_date) {
    await supabase
      .from('contents')
      .update({ status: 'approved_by_client' })
      .eq('client_id', content.client_id)
      .eq('type', 'story')
      .eq('scheduled_date', content.scheduled_date)
      .eq('status', 'sent_to_client')
  }

  // ── Acionar n8n para publicar no Meta ───────────────────────────────────
  const socialResult: {
    facebook:  { scheduled: boolean; error?: string }
    instagram: { scheduled: boolean; error?: string }
  } = {
    facebook:  { scheduled: false },
    instagram: { scheduled: false },
  }

  const n8nWebhookUrl = process.env.N8N_WEBHOOK_PUBLICAR_META

  const pageToken = getMetaToken(client.facebook_page_token)

  const canSchedule =
    status === 'approved_by_client' &&
    client.facebook_page_id &&
    pageToken &&
    content.scheduled_date

  if (canSchedule && n8nWebhookUrl) {
    const payload = {
      content_id:     contentId,
      content_type:   content.type ?? 'imagem',
      caption:        content.caption ?? '',
      image_url:      content.generated_image_url ?? null,
      media_urls:     content.media_urls ?? [],
      scheduled_date: content.scheduled_date!,
      scheduled_time: (content as Record<string, unknown>).scheduled_time as string ?? '09:00',
      page_id:        client.facebook_page_id!,
      page_token:     pageToken,
      ig_account_id:  client.instagram_account_id ?? null,
    }

    // Fire-and-forget — não bloqueia a resposta (carrosseis podem demorar 60s+)
    fetch(n8nWebhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    }).catch((e) => console.error('[n8n] Falha ao chamar webhook:', e))

    socialResult.facebook  = { scheduled: true }
    socialResult.instagram = { scheduled: true }
  } else if (canSchedule && !n8nWebhookUrl) {
    console.warn('[n8n] N8N_WEBHOOK_PUBLICAR_META não configurado — publicação no Meta ignorada')
  }

  return NextResponse.json({ ok: true, social: socialResult })
}
