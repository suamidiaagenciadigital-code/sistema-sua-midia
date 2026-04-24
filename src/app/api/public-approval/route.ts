import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

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

  // ── Acionar n8n para publicar no Meta ───────────────────────────────────
  const socialResult: {
    facebook:  { scheduled: boolean; error?: string }
    instagram: { scheduled: boolean; error?: string }
  } = {
    facebook:  { scheduled: false },
    instagram: { scheduled: false },
  }

  const n8nWebhookUrl = process.env.N8N_WEBHOOK_PUBLICAR_META

  const canSchedule =
    status === 'approved_by_client' &&
    client.facebook_page_id &&
    client.facebook_page_token &&
    content.scheduled_date

  if (canSchedule && n8nWebhookUrl) {
    const payload = {
      content_id:     contentId,
      content_type:   content.type ?? 'imagem',
      caption:        content.caption ?? '',
      image_url:      content.generated_image_url ?? null,
      media_urls:     content.media_urls ?? [],        // carrossel: array de URLs
      scheduled_date: content.scheduled_date!,
      scheduled_time: (content as Record<string, unknown>).scheduled_time as string ?? '09:00',
      page_id:        client.facebook_page_id!,
      page_token:     client.facebook_page_token!,
      ig_account_id:  client.instagram_account_id ?? null,
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 25_000) // 25s timeout

      const n8nResp = await fetch(n8nWebhookUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
        signal:  controller.signal,
      })
      clearTimeout(timeout)

      if (n8nResp.ok) {
        const data = await n8nResp.json() as {
          facebook?:  { post_id: string | null; error: string | null }
          instagram?: { post_id: string | null; error: string | null }
        }
        socialResult.facebook  = { scheduled: !!data.facebook?.post_id,  error: data.facebook?.error  ?? undefined }
        socialResult.instagram = { scheduled: !!data.instagram?.post_id, error: data.instagram?.error ?? undefined }
      } else {
        console.error('[n8n] Resposta com erro:', n8nResp.status)
        socialResult.facebook.error = `n8n retornou status ${n8nResp.status}`
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[n8n] Falha ao chamar webhook:', msg)
      // Não bloqueia a aprovação — só loga o erro
    }
  } else if (canSchedule && !n8nWebhookUrl) {
    console.warn('[n8n] N8N_WEBHOOK_PUBLICAR_META não configurado — publicação no Meta ignorada')
  }

  return NextResponse.json({ ok: true, social: socialResult })
}
