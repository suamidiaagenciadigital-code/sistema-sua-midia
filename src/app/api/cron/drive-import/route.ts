import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rehostIfDriveVideo } from '@/lib/rehost-video'
import {
  listSubfolders,
  listFiles,
  downloadFileContent,
  renameFile,
  publicFileUrl,
  type DriveFile,
} from '@/lib/google-drive'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const MESES = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO',
]

// Pasta de dia no formato "DD-MM"
const DAY_FOLDER = /^(\d{2})-(\d{2})$/

interface DayPostJson {
  type: 'imagem' | 'reel' | 'story' | 'carrossel'
  caption?: string
  title?: string
  scheduled_time?: string
  files: string[] // nomes dos arquivos, exatamente como aparecem no Drive
}

function normalize(s: string): string {
  return s.trim().toUpperCase()
}

async function processJsonFile(
  client: { id: string; name: string },
  jsonFile: DriveFile,
  dayFiles: DriveFile[],
  scheduledDate: string,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<{ status: 'imported' | 'skipped' | 'error'; reason?: string; contentId?: string }> {
  let parsed: DayPostJson
  try {
    const raw = await downloadFileContent(jsonFile.id)
    parsed = JSON.parse(raw)
  } catch (e: any) {
    return { status: 'error', reason: `JSON inválido: ${e.message}` }
  }

  const caption = (parsed.caption ?? '').trim()
  if (!caption) {
    return { status: 'skipped', reason: 'Legenda vazia no .json' }
  }
  if (!['imagem', 'reel', 'story', 'carrossel'].includes(parsed.type)) {
    return { status: 'skipped', reason: `Tipo inválido: "${parsed.type}"` }
  }
  if (!parsed.files || parsed.files.length === 0) {
    return { status: 'skipped', reason: 'Nenhum arquivo de mídia listado no .json' }
  }

  // Resolve cada nome de arquivo citado para o ID real na pasta do dia
  const resolved: DriveFile[] = []
  for (const fname of parsed.files) {
    const match = dayFiles.find((f) => f.name === fname)
    if (!match) {
      return { status: 'skipped', reason: `Arquivo "${fname}" citado no .json não encontrado na pasta` }
    }
    resolved.push(match)
  }

  const urls = resolved.map((f) => publicFileUrl(f.id))
  const isMultiFile = urls.length > 1

  let generatedImageUrl: string | null = null
  let mediaUrls: string[] | null = null

  if (parsed.type === 'reel') {
    generatedImageUrl = await rehostIfDriveVideo(urls[0], client.id)
    if (!generatedImageUrl || generatedImageUrl.includes('drive.google.com')) {
      return { status: 'error', reason: 'Falha ao re-hospedar o vídeo do Drive (arquivo indisponível ou muito grande)' }
    }
  } else if (isMultiFile || parsed.type === 'carrossel' || parsed.type === 'story') {
    mediaUrls = urls
  } else {
    generatedImageUrl = urls[0]
  }

  const title = parsed.title?.trim() || `${parsed.type} ${scheduledDate.split('-').reverse().slice(0, 2).join('-')}`

  const { data: content, error } = await supabase
    .from('contents')
    .insert({
      client_id: client.id,
      type: parsed.type,
      title,
      caption,
      scheduled_date: scheduledDate,
      scheduled_time: parsed.scheduled_time || null,
      status: 'sent_to_client',
      requires_client_approval: parsed.type === 'story',
      generated_image_url: generatedImageUrl,
      media_urls: mediaUrls,
    })
    .select('id')
    .single()

  if (error || !content) {
    return { status: 'error', reason: `Erro ao salvar no banco: ${error?.message}` }
  }

  // Marca como processado — renomear é redundante com o registro em
  // drive_imports, mas deixa visível pra quem olhar a pasta manualmente.
  try {
    await renameFile(jsonFile.id, jsonFile.name.replace(/\.json$/i, '.importado.json'))
  } catch {
    // Não bloqueia a importação se o rename falhar
  }

  return { status: 'imported', contentId: content.id }
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, drive_folder_id')
    .not('drive_folder_id', 'is', null)

  const summary: Record<string, unknown>[] = []

  for (const client of clients ?? []) {
    try {
      const now = new Date()

      // Estrutura real no Drive: Cliente / Ano / Mês / Dia
      const yearFolders = await listSubfolders(client.drive_folder_id!)
      const yearName = String(now.getFullYear())
      const yearFolder = yearFolders.find((f) => f.name.trim() === yearName)
      if (!yearFolder) {
        summary.push({ client: client.name, error: `Pasta do ano "${yearName}" não encontrada` })
        continue
      }

      const monthFolders = await listSubfolders(yearFolder.id)
      const monthName = MESES[now.getMonth()]
      const monthFolder = monthFolders.find((f) => normalize(f.name) === monthName)
      if (!monthFolder) {
        summary.push({ client: client.name, error: `Pasta do mês "${monthName}" não encontrada dentro de ${yearName}` })
        continue
      }

      const dayFolders = await listSubfolders(monthFolder.id)

      for (const dayFolder of dayFolders) {
        const match = dayFolder.name.match(DAY_FOLDER)
        if (!match) continue
        const [, dd, mm] = match
        const scheduledDate = `${now.getFullYear()}-${mm}-${dd}`

        const dayFiles = await listFiles(dayFolder.id)
        const jsonFiles = dayFiles.filter(
          (f) => /\.json$/i.test(f.name) && !/\.importado\.json$/i.test(f.name),
        )

        for (const jsonFile of jsonFiles) {
          // Idempotência: já processado antes?
          const { data: already } = await supabase
            .from('drive_imports')
            .select('id')
            .eq('drive_json_file_id', jsonFile.id)
            .maybeSingle()
          if (already) continue

          const result = await processJsonFile(client, jsonFile, dayFiles, scheduledDate, supabase)

          await supabase.from('drive_imports').insert({
            client_id: client.id,
            drive_json_file_id: jsonFile.id,
            folder_name: dayFolder.name,
            status: result.status,
            reason: result.reason ?? null,
            content_id: result.contentId ?? null,
          })

          summary.push({ client: client.name, folder: dayFolder.name, ...result })
        }
      }
    } catch (e: any) {
      summary.push({ client: client.name, error: e.message })
    }
  }

  return NextResponse.json({ ok: true, processed: summary })
}
