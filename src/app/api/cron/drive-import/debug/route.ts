import { NextRequest, NextResponse } from 'next/server'

// Rota de diagnóstico TEMPORÁRIA — não expõe a chave, só metadados pra
// entender por que o JSON.parse falha. Remover depois de resolver.
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

  if (!raw) {
    return NextResponse.json({ present: false })
  }

  const info: Record<string, unknown> = {
    present: true,
    length: raw.length,
    startsWithBrace: raw.trimStart().startsWith('{'),
    endsWithBrace: raw.trimEnd().endsWith('}'),
    first30: raw.slice(0, 30),
    last30: raw.slice(-30),
    realNewlineCount: (raw.match(/\n/g) ?? []).length,
    literalBackslashNCount: (raw.match(/\\n/g) ?? []).length,
    containsBeginPrivateKey: raw.includes('BEGIN PRIVATE KEY'),
  }

  try {
    const parsed = JSON.parse(raw)
    info.parseDirect = 'ok'
    info.hasClientEmail = typeof parsed.client_email === 'string'
    info.hasPrivateKey = typeof parsed.private_key === 'string'
    info.privateKeyLength = parsed.private_key?.length ?? 0
  } catch (e: any) {
    info.parseDirect = 'FAILED'
    info.parseDirectError = e.message
  }

  return NextResponse.json(info)
}
