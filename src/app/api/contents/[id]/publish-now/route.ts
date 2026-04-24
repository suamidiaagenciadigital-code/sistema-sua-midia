import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: contentId } = await params
  const supabase = createServiceClient()

  // Buscar conteúdo
  const { data: content } = await supabase
    .from('contents')
    .select('id, client_id, type, caption, generated_image_url, media_urls, scheduled_date')
    .eq('id', contentId)
    .single()

  if (!content) {
    return NextResponse.json({ error: 'Conteúdo não encontrado' }, { status: 404 })
  }

  // Buscar dados do cliente
  const { data: client } = await supabase
    .from('clients')
    .select('facebook_page_id, facebook_page_token, instagram_account_id')
    .eq('id', content.client_id)
    .single()

  if (!client?.facebook_page_id || !client?.facebook_page_token) {
    return NextResponse.json({ error: 'Integrações Meta não configuradas para este cliente' }, { status: 400 })
  }

  const n8nWebhookUrl = process.env.N8N_WEBHOOK_PUBLICAR_META
  if (!n8nWebhookUrl) {
    return NextResponse.json({ error: 'N8N_WEBHOOK_PUBLICAR_META não configurado' }, { status: 500 })
  }

  const today = new Date().toISOString().split('T')[0]

  const payload = {
    content_id:        contentId,
    content_type:      content.type ?? 'imagem',
    caption:           content.caption ?? '',
    image_url:         content.generated_image_url ?? null,
    media_urls:        content.media_urls ?? [],
    scheduled_date:    content.scheduled_date ?? today,
    scheduled_time:    '00:00',
    publish_immediately: true,          // ← flag para publicação imediata
    page_id:           client.facebook_page_id,
    page_token:        client.facebook_page_token,
    ig_account_id:     client.instagram_account_id ?? null,
  }

  // Atualizar status imediatamente (o n8n atualiza novamente ao final com post_ids)
  await supabase.from('contents').update({ status: 'published' }).eq('id', contentId)

  // Disparar n8n em background (fire-and-forget) — carrosseis podem demorar 60s+
  fetch(n8nWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((e) => console.error('[publish-now] n8n erro background:', e))

  return NextResponse.json({ ok: true, social: { queued: true } })
}
