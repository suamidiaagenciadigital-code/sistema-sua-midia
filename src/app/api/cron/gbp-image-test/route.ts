import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { adaptPostForGbp } from '@/lib/gbp-text'
import { createGbpPost, deleteGbpPost, getGoogleAccessToken } from '@/lib/google-business'

// TEMPORÁRIA: publica uma imagem só no Google (teste), será removida.
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')!
  const src = req.nextUrl.searchParams.get('src')!
  const supabase = createServiceClient()
  if (req.nextUrl.searchParams.get('del')) {
    const { data: d } = await supabase.from('contents').select('gbp_post_name').eq('id', id).single()
    const t = await getGoogleAccessToken()
    if (!d?.gbp_post_name || !t.token) return NextResponse.json({ error: 'nada para apagar' })
    const ok = await deleteGbpPost(t.token, d.gbp_post_name)
    if (ok) await supabase.from('contents').update({ gbp_status: null, gbp_post_name: null, gbp_published_at: null }).eq('id', id)
    return NextResponse.json({ apagado: ok })
  }
  const { data: c } = await supabase.from('contents').select('client_id, caption, gbp_post_name').eq('id', id).single()
  if (!c) return NextResponse.json({ error: 'conteudo nao encontrado' })
  if (c.gbp_post_name) return NextResponse.json({ error: 'ja publicado no Google', name: c.gbp_post_name })
  const { data: gc } = await supabase.from('clients').select('gbp_account_id, gbp_location_id, gbp_cta_type, gbp_cta_url, gbp_location_title').eq('id', c.client_id).single()
  const { token, error } = await getGoogleAccessToken()
  if (!token || !gc) return NextResponse.json({ error: error ?? 'sem cliente' })
  const summary = adaptPostForGbp(c.caption)
  const res = await createGbpPost(token, {
    accountId: gc.gbp_account_id, locationId: gc.gbp_location_id, summary, imageUrl: src,
    ctaType: gc.gbp_cta_type, ctaUrl: gc.gbp_cta_url,
  })
  if (res.name) {
    await supabase.from('contents').update({
      gbp_status: res.state === 'REJECTED' ? 'failed' : 'published', gbp_post_name: res.name,
      gbp_error: null, gbp_published_at: new Date().toISOString(),
    }).eq('id', id)
  }
  return NextResponse.json({ perfil: gc.gbp_location_title, summary, res })
}
