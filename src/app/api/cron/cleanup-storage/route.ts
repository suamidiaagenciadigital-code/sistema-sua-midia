import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { cleanupAfterPublish } from '@/lib/cleanup-media'

// Limpeza semanal do bucket "media" (cron-job.org, sábado). O plano gratuito do
// Supabase tem 1 GB de storage; sem isso o bucket enche de vídeos de posts que
// já saíram.
//
// Regras (a ordem importa — na dúvida, o arquivo fica):
//  1. Arquivo citado por QUALQUER coisa que não seja post publicado (post ainda
//     na fila, biblioteca de mídia, cliente, proposta) → fica.
//  2. Arquivo que só aparece em posts publicados há 7+ dias:
//       - tem o ID do Drive no nome → o post volta a apontar para o Drive e a
//         cópia é apagada (nada se perde);
//       - não tem (upload manual do computador) → a cópia é apagada.
//  3. Arquivo que ninguém cita e tem 7+ dias (sobra de upload/rehost) → apagado.
//
// ?dry=1 só mostra o que seria feito, sem mexer em nada.
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const GRACE_DAYS = 7
const DAY = 24 * 60 * 60 * 1000
const DRIVE_PATH = /^.+\/drive-[^/]+-\d+\.[a-z0-9]+$/i

interface StoredFile { path: string; size: number; createdAt: number }

type Supabase = ReturnType<typeof createServiceClient>

async function listAll(supabase: Supabase): Promise<StoredFile[]> {
  const out: StoredFile[] = []
  async function walk(prefix: string) {
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.storage.from('media').list(prefix, { limit: 1000, offset })
      if (error) throw new Error(`Falha ao listar o storage: ${error.message}`)
      if (!data || data.length === 0) break
      for (const o of data) {
        const path = prefix ? `${prefix}/${o.name}` : o.name
        if (o.id === null) await walk(path)
        else out.push({
          path,
          size: Number((o.metadata as { size?: number } | null)?.size ?? 0),
          createdAt: o.created_at ? new Date(o.created_at).getTime() : 0,
        })
      }
      if (data.length < 1000) break
    }
  }
  await walk('')
  return out
}

async function fetchAll(supabase: Supabase, table: string): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = []
  for (let off = 0; ; off += 1000) {
    const { data, error } = await supabase.from(table).select('*').range(off, off + 999)
    if (error) throw new Error(`Falha ao ler ${table}: ${error.message}`)
    rows.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  return rows
}

const mb = (n: number) => Math.round((n / 1048576) * 10) / 10

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  const bearer = req.headers.get('authorization')
  if (secret !== process.env.CRON_SECRET && bearer !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dry = req.nextUrl.searchParams.get('dry') === '1'
  const supabase = createServiceClient()

  try {
    const now = Date.now()
    const brasiliaToday = new Date(now - 3 * 60 * 60 * 1000)
    const cutoffDate = new Date(brasiliaToday.getTime() - GRACE_DAYS * DAY).toISOString().slice(0, 10)

    const files = await listAll(supabase)
    const contents = await fetchAll(supabase, 'contents')

    // Tudo que NÃO é post publicado: se citar o arquivo, ele fica.
    const otherRows: unknown[] = contents.filter((c) => c.status !== 'published')
    for (const t of ['media', 'clients', 'proposals']) {
      try { otherRows.push(...(await fetchAll(supabase, t))) } catch { /* tabela opcional */ }
    }
    const otherBlob = JSON.stringify(otherRows)

    const published = contents.filter((c) => c.status === 'published')
    const mediaOnly = (c: Record<string, unknown>) =>
      JSON.stringify([c.generated_image_url, c.media_urls])
    const restOnly = (c: Record<string, unknown>) => {
      const { generated_image_url: _g, media_urls: _m, ...rest } = c
      return JSON.stringify(rest)
    }

    const swapContentIds = new Set<string>()   // posts a re-apontar para o Drive
    const deleteOnly: string[] = []            // sem Drive: só apaga o arquivo
    const orphans: string[] = []
    let kept = 0

    for (const f of files) {
      const base = f.path.split('/').pop()!
      if (otherBlob.includes(base)) { kept++; continue }

      const refs = published.filter((c) => mediaOnly(c).includes(base) || restOnly(c).includes(base))

      if (refs.length === 0) {
        if (f.createdAt && now - f.createdAt >= GRACE_DAYS * DAY) orphans.push(f.path)
        else kept++
        continue
      }

      // Só mexe se TODOS os posts que usam o arquivo saíram há 7+ dias e se o
      // arquivo está só nos campos de mídia (único lugar que a troca cobre).
      const old = refs.every((c) => typeof c.scheduled_date === 'string' && c.scheduled_date <= cutoffDate)
      const onlyMediaFields = refs.every((c) => !restOnly(c).includes(base))
      if (!old || !onlyMediaFields) { kept++; continue }

      if (DRIVE_PATH.test(f.path)) refs.forEach((c) => swapContentIds.add(c.id as string))
      else deleteOnly.push(f.path)
    }

    const size = new Map(files.map((f) => [f.path, f.size]))
    const report = {
      dry,
      cutoffPublicadosAte: cutoffDate,
      arquivosNoBucket: files.length,
      totalMB: mb(files.reduce((s, f) => s + f.size, 0)),
      mantidos: kept,
      postsParaTrocarPeloDrive: swapContentIds.size,
      apagarSemDrive: deleteOnly.length,
      apagarSobras: orphans.length,
      liberadoMB: 0,
    }

    if (dry) {
      report.liberadoMB = mb([...deleteOnly, ...orphans].reduce((s, p) => s + (size.get(p) ?? 0), 0))
      return NextResponse.json({ ok: true, ...report, exemploSemDrive: deleteOnly.slice(0, 20), exemploSobras: orphans.slice(0, 20) })
    }

    let freed = 0

    // 2a. Posts com cópia do Drive: re-aponta e apaga (helper já testado)
    for (const id of swapContentIds) {
      const r = await cleanupAfterPublish(id, supabase)
      freed += r.freedPaths.reduce((s, p) => s + (size.get(p) ?? 0), 0)
    }

    // 2b + 3. Sem Drive e sobras: apaga em lotes
    const toRemove = [...deleteOnly, ...orphans]
    for (let i = 0; i < toRemove.length; i += 100) {
      const batch = toRemove.slice(i, i + 100)
      const { error } = await supabase.storage.from('media').remove(batch)
      if (error) console.error('[cleanup-storage] remove falhou:', error.message)
      else freed += batch.reduce((s, p) => s + (size.get(p) ?? 0), 0)
    }

    report.liberadoMB = mb(freed)
    console.log('[cleanup-storage]', JSON.stringify(report))
    return NextResponse.json({ ok: true, ...report })
  } catch (e) {
    console.error('[cleanup-storage] erro:', e)
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
