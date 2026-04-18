import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { scheduleOnSocialMedia } from '@/lib/facebook'

export async function POST(req: NextRequest) {
  const { contentId, token, status, revisionNotes } = await req.json()

  if (!['approved_by_client', 'revision'].includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Verificar que o token pertence ao cliente dono do conteúdo
  const { data: content } = await supabase
    .from('contents')
    .select('id, client_id, status, caption, generated_image_url, scheduled_date')
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

  // ── Agendar nas redes sociais quando cliente aprova ────────────────────
  let socialResult: {
    facebook: { scheduled: boolean; error?: string }
    instagram: { scheduled: boolean; error?: string }
  } = {
    facebook: { scheduled: false },
    instagram: { scheduled: false },
  }

  const canSchedule =
    status === 'approved_by_client' &&
    client.facebook_page_id &&
    client.facebook_page_token &&
    content.scheduled_date

  if (canSchedule) {
    const result = await scheduleOnSocialMedia({
      pageId: client.facebook_page_id!,
      pageToken: client.facebook_page_token!,
      instagramAccountId: client.instagram_account_id ?? null,
      caption: content.caption ?? '',
      imageUrl: content.generated_image_url ?? null,
      scheduledDate: content.scheduled_date!,
    })

    // Montar atualização com IDs dos posts agendados
    const socialUpdate: Record<string, unknown> = {}

    if (result.facebook.post_id) {
      socialUpdate.facebook_post_id = result.facebook.post_id
      socialResult.facebook = { scheduled: true }
    } else {
      socialResult.facebook = { scheduled: false, error: result.facebook.error ?? undefined }
      if (result.facebook.error) console.error('[Facebook]', result.facebook.error)
    }

    if (result.instagram.post_id) {
      socialUpdate.instagram_post_id = result.instagram.post_id
      socialResult.instagram = { scheduled: true }
    } else if (result.instagram.error) {
      socialResult.instagram = { scheduled: false, error: result.instagram.error }
      console.error('[Instagram]', result.instagram.error)
    }

    // Marcar como publicado se pelo menos uma plataforma agendou com sucesso
    if (result.facebook.post_id || result.instagram.post_id) {
      socialUpdate.status = 'published'
    }

    if (Object.keys(socialUpdate).length > 0) {
      await supabase.from('contents').update(socialUpdate).eq('id', contentId)
    }
  }

  return NextResponse.json({ ok: true, social: socialResult })
}
