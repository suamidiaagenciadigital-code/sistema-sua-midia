import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { listSubfolders, listFiles, downloadFileContent } from '@/lib/google-drive'

// TEMPORÁRIO (depuração do story da Nova Visão): lista os arquivos de uma pasta
// de dia no Drive e mostra o conteúdo dos .json. Protegido por CRON_SECRET.
// Apagar depois de usar.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MESES = ['JANEIRO', 'FEVEREIRO', 'MARCO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO']
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase()

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = req.nextUrl.searchParams.get('client') ?? ''
  const day = req.nextUrl.searchParams.get('day') ?? ''
  const month = Number(req.nextUrl.searchParams.get('month') ?? '0') // 1-12
  const year = req.nextUrl.searchParams.get('year') ?? String(new Date().getFullYear())

  const supabase = createServiceClient()
  const { data: c } = await supabase.from('clients').select('name, drive_folder_id').ilike('name', `%${client}%`).limit(1).single()
  if (!c?.drive_folder_id) return NextResponse.json({ error: 'cliente sem pasta' }, { status: 404 })

  const years = await listSubfolders(c.drive_folder_id)
  const y = years.find((f) => f.name.trim() === year)
  if (!y) return NextResponse.json({ error: 'sem pasta do ano' }, { status: 404 })
  const months = await listSubfolders(y.id)
  const m = months.find((f) => norm(f.name) === MESES[month - 1])
  if (!m) return NextResponse.json({ error: 'sem pasta do mês' }, { status: 404 })
  const days = await listSubfolders(m.id)
  const d = days.find((f) => f.name.trim() === day)
  if (!d) return NextResponse.json({ error: 'sem pasta do dia', dias: days.map((x) => x.name) }, { status: 404 })

  const files = await listFiles(d.id)
  const jsons: Record<string, unknown> = {}
  for (const f of files.filter((x) => /\.json$/i.test(x.name))) {
    try { jsons[f.name] = JSON.parse(await downloadFileContent(f.id)) } catch { jsons[f.name] = 'ilegível' }
  }
  return NextResponse.json({
    cliente: c.name,
    pasta: `${year}/${MESES[month - 1]}/${day}`,
    arquivos: files.map((f) => ({ nome: f.name, id: f.id })),
    jsons,
  })
}
