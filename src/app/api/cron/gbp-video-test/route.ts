import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAccessToken } from '@/lib/google-business'

// TEMPORÁRIA: testa o envio de vídeo ao Google Business (será removida).
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const mode = req.nextUrl.searchParams.get('mode') ?? 'media'
  if (mode === 'list') { const t = await getGoogleAccessToken(); const r = await fetch('https://mybusiness.googleapis.com/v4/accounts/114410726627699087332/locations/14345347103907789071/media?pageSize=5', { headers: { Authorization: 'Bearer ' + t.token } }); return NextResponse.json(await r.json()) }
  const src = req.nextUrl.searchParams.get('src')!
  const { token, error } = await getGoogleAccessToken()
  if (!token) return NextResponse.json({ error })
  const parent = 'accounts/114410726627699087332/locations/14345347103907789071'
  const body = mode === 'post'
    ? { languageCode: 'pt-BR', topicType: 'STANDARD', summary: 'Teste', media: [{ mediaFormat: 'VIDEO', sourceUrl: src }] }
    : { mediaFormat: 'VIDEO', locationAssociation: { category: 'ADDITIONAL' }, sourceUrl: src }
  const res = await fetch(`https://mybusiness.googleapis.com/v4/${parent}/${mode === 'post' ? 'localPosts' : 'media'}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return NextResponse.json({ status: res.status, json: await res.json().catch(() => null) })
}
