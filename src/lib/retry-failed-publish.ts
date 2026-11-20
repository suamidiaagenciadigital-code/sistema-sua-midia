import { createServiceClient } from '@/lib/supabase/server'

// Nova tentativa automática para posts que saíram "publicados" mas falharam numa
// rede por um erro de conexão (timeout da Meta ao buscar a mídia, falha de rede).
//
// Regras, pensadas para nunca duplicar post:
//  - só tenta a rede que falhou e que NÃO tem ID guardado (o publish-now já reaproveita
//    o ID da rede que deu certo);
//  - só erros que acontecem ANTES de a Meta aceitar a mídia (timeout 2207003/-2, falha
//    de rede, "tente de novo"). Erro de formato, de processamento ou de permissão não
//    voltam a ser tentados: iam falhar do mesmo jeito;
//  - só na janela de 2 horas a partir do horário agendado (o cron roda a cada 15 min);
//  - "claim" atômico antes de tentar: duas execuções do cron nunca tentam o mesmo post.

const RETRY_WINDOW_MS = 2 * 60 * 60 * 1000
const MAX_PER_RUN = 5
const RETRYING = 'Tentando novamente…'

const TRANSIENT_IG = /\b2207003\b|code: -2\b|time(d)? ?out/i
const TRANSIENT_FB = /unexpected error|please retry|try again later|temporarily|time(d)? ?out|fetch failed|ETIMEDOUT|ECONNRESET/i

export interface RetryResult {
  tried: number
  results: { id: string; ok: boolean; facebook?: string | null; instagram?: string | null; error?: string }[]
}

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

export async function retryTransientFailures(now = new Date()): Promise<RetryResult> {
  const supabase = createServiceClient()
  const brasilia = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  const today = brasilia.toISOString().split('T')[0]
  const yesterday = new Date(brasilia.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: rows } = await supabase
    .from('contents')
    .select('id, scheduled_date, scheduled_time, facebook_post_id, instagram_post_id, facebook_publish_error, instagram_publish_error')
    .eq('status', 'published')
    .or('facebook_publish_error.not.is.null,instagram_publish_error.not.is.null')
    .gte('scheduled_date', yesterday)
    .lte('scheduled_date', today)

  const due = (rows ?? [])
    .map((c) => {
      const at = Date.parse(`${c.scheduled_date}T${((c.scheduled_time as string | null) ?? '00:00').slice(0, 5)}:00-03:00`)
      const elapsed = now.getTime() - at
      const igErr = (c.instagram_publish_error as string | null) ?? null
      const fbErr = (c.facebook_publish_error as string | null) ?? null
      const retryIg = !!igErr && !c.instagram_post_id && TRANSIENT_IG.test(igErr)
      const retryFb = !!fbErr && !c.facebook_post_id && TRANSIENT_FB.test(fbErr)
      return { id: c.id as string, elapsed, igErr, fbErr, retryIg, retryFb }
    })
    .filter((c) => (c.retryIg || c.retryFb) && c.elapsed >= 0 && c.elapsed <= RETRY_WINDOW_MS)
    .slice(0, MAX_PER_RUN)

  const out: RetryResult = { tried: 0, results: [] }

  await Promise.all(
    due.map(async (c) => {
      // Claim atômico: só segue se os erros ainda são os que lemos
      const patch: Record<string, string> = {}
      if (c.retryIg) patch.instagram_publish_error = RETRYING
      if (c.retryFb) patch.facebook_publish_error = RETRYING
      let q = supabase.from('contents').update(patch).eq('id', c.id).eq('status', 'published')
      if (c.retryIg) q = q.eq('instagram_publish_error', c.igErr as string)
      if (c.retryFb) q = q.eq('facebook_publish_error', c.fbErr as string)
      const { data: claimed } = await q.select('id')
      if (!claimed || claimed.length === 0) return

      out.tried++
      try {
        const resp = await fetch(`${baseUrl()}/api/contents/${c.id}/publish-now`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-cron-secret': process.env.CRON_SECRET ?? '' },
          body: JSON.stringify({}),
        })
        const data = await resp.json().catch(() => ({}))
        console.log(`[retry] ${c.id}:`, JSON.stringify(data))
        out.results.push({
          id: c.id,
          ok: !!data.ok,
          facebook: data.facebook?.error ?? null,
          instagram: data.instagram?.error ?? null,
        })
      } catch (e: unknown) {
        // A chamada nem completou: devolve o erro original para ele continuar visível
        // (e poder ser tentado de novo no próximo ciclo)
        const msg = e instanceof Error ? e.message : String(e)
        const back: Record<string, string | null> = {}
        if (c.retryIg) back.instagram_publish_error = c.igErr
        if (c.retryFb) back.facebook_publish_error = c.fbErr
        await supabase.from('contents').update(back).eq('id', c.id)
        out.results.push({ id: c.id, ok: false, error: msg })
      }
    }),
  )

  return out
}
