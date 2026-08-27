/**
 * cleanup-media.ts
 *
 * Vídeos do Drive são copiados para o Supabase Storage porque o Instagram não
 * consegue baixá-los direto do Drive. Depois que a publicação sai, essa cópia
 * não serve mais para nada — e era o que vinha estourando a cota de storage.
 *
 * A limpeza só acontece quando dá para reconstruir a URL original: o caminho do
 * arquivo guarda o ID do Drive (`{clientId}/drive-{fileId}-{timestamp}.{ext}`).
 * Sem esse ID não há como voltar a apontar para o Drive, então o arquivo fica.
 */

import { createServiceClient } from '@/lib/supabase/server'

const STORAGE_MARK = '/storage/v1/object/public/media/'
const DRIVE_PATH = /^(.+\/drive-([^/]+)-\d+\.[a-z0-9]+)$/i

type Supabase = ReturnType<typeof createServiceClient>

/** Extrai o caminho no bucket a partir da URL pública do Supabase. */
function storagePath(url: string | null | undefined): string | null {
  if (!url || !url.includes(STORAGE_MARK)) return null
  return url.split(STORAGE_MARK)[1].split('?')[0]
}

/** Se o caminho carrega o ID do Drive, devolve a URL original do arquivo. */
function driveUrlFromPath(path: string): string | null {
  const match = path.match(DRIVE_PATH)
  return match ? `https://drive.google.com/file/d/${match[2]}/view` : null
}

/**
 * Troca as cópias do Supabase pela URL original do Drive e apaga os arquivos.
 * Silencioso por natureza: falha aqui não pode derrubar uma publicação que já
 * deu certo, então erros são apenas logados.
 */
export async function cleanupAfterPublish(
  contentId: string,
  supabase: Supabase,
): Promise<{ removed: number; freedPaths: string[] }> {
  const noop = { removed: 0, freedPaths: [] as string[] }

  try {
    const { data: content } = await supabase
      .from('contents')
      .select('generated_image_url, media_urls')
      .eq('id', contentId)
      .single()

    if (!content) return noop

    const toDelete: string[] = []

    // Campo único (reel / imagem / story)
    let newGenerated = content.generated_image_url as string | null
    const genPath = storagePath(newGenerated)
    if (genPath) {
      const drive = driveUrlFromPath(genPath)
      if (drive) {
        toDelete.push(genPath)
        newGenerated = drive
      }
    }

    // Array de mídias (carrossel / story com vários frames)
    const originalUrls = (content.media_urls as string[] | null) ?? []
    const newMediaUrls = originalUrls.map((u) => {
      const p = storagePath(u)
      if (!p) return u
      const drive = driveUrlFromPath(p)
      if (!drive) return u
      toDelete.push(p)
      return drive
    })

    if (toDelete.length === 0) return noop

    // Banco primeiro: se o storage falhar, sobra arquivo órfão — inverter a
    // ordem deixaria o conteúdo apontando para um arquivo já apagado.
    const update: Record<string, unknown> = {}
    if (newGenerated !== content.generated_image_url) update.generated_image_url = newGenerated
    if (originalUrls.length > 0) update.media_urls = newMediaUrls

    if (Object.keys(update).length > 0) {
      const { error } = await supabase.from('contents').update(update).eq('id', contentId)
      if (error) {
        console.error('[cleanup-media] update falhou:', error.message)
        return noop
      }
    }

    const { error: delError } = await supabase.storage.from('media').remove(toDelete)
    if (delError) {
      console.error('[cleanup-media] remove falhou:', delError.message)
      return noop
    }

    console.log(`[cleanup-media] ${toDelete.length} arquivo(s) removido(s) do conteúdo ${contentId}`)
    return { removed: toDelete.length, freedPaths: toDelete }
  } catch (err) {
    console.error('[cleanup-media] erro:', err)
    return noop
  }
}
