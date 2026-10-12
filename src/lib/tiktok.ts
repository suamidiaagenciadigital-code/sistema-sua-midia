import { createServiceClient } from '@/lib/supabase/server'

// Integração TikTok (Login Kit + Content Posting API).
// Chaves do app ficam nas variáveis de ambiente da Vercel:
//   TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET
// Enquanto o app não passa na auditoria do TikTok, tudo que ele publica fica
// visível só para o dono da conta (privacy_level SELF_ONLY).

export const TIKTOK_AUTHORIZE_URL = 'https://www.tiktok.com/v2/auth/authorize/'
const TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/'
export const TIKTOK_API = 'https://open.tiktokapis.com/v2'
export const TIKTOK_SCOPES = 'user.info.basic,video.publish'

export function tiktokRedirectUri(): string {
  // Domínio oficial do sistema. Precisa ser idêntico ao Redirect URI cadastrado
  // no app do TikTok (por isso não usa NEXT_PUBLIC_APP_URL, que pode apontar
  // para o endereço da Vercel).
  const base = process.env.TIKTOK_REDIRECT_BASE ?? 'https://sistema.suamidia.com.br'
  return `${base.replace(/\/$/, '')}/api/tiktok/callback`
}

export function tiktokKeys(): { key: string; secret: string } | null {
  const key = process.env.TIKTOK_CLIENT_KEY
  const secret = process.env.TIKTOK_CLIENT_SECRET
  return key && secret ? { key, secret } : null
}

export interface TikTokTokenResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  refresh_expires_in?: number
  open_id?: string
  scope?: string
  error?: string
  error_description?: string
}

async function tokenRequest(params: Record<string, string>): Promise<TikTokTokenResponse> {
  const keys = tiktokKeys()
  if (!keys) return { error: 'config', error_description: 'TIKTOK_CLIENT_KEY/SECRET não configurados' }
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_key: keys.key, client_secret: keys.secret, ...params }),
  })
  return res.json().catch(() => ({ error: 'invalid_response' }))
}

export function exchangeCode(code: string): Promise<TikTokTokenResponse> {
  return tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: tiktokRedirectUri() })
}

/** Grava (ou atualiza) a conexão do cliente a partir de uma resposta de token. */
export async function saveConnection(
  clientId: string,
  t: TikTokTokenResponse,
  displayName?: string | null,
) {
  const supabase = createServiceClient()
  const now = Date.now()
  const row: Record<string, unknown> = {
    client_id: clientId,
    open_id: t.open_id,
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    access_expires_at: new Date(now + (t.expires_in ?? 86400) * 1000).toISOString(),
    refresh_expires_at: new Date(now + (t.refresh_expires_in ?? 31536000) * 1000).toISOString(),
    scope: t.scope ?? null,
    updated_at: new Date().toISOString(),
  }
  if (displayName !== undefined) row.display_name = displayName
  return supabase.from('tiktok_connections').upsert(row, { onConflict: 'client_id' })
}

/**
 * Devolve um access token válido do cliente, renovando se faltar menos de 5
 * minutos para expirar. O TikTok pode devolver um refresh_token novo — sempre
 * grava o que vier.
 */
export async function getTikTokAccessToken(
  clientId: string,
): Promise<{ token: string | null; error?: string }> {
  const supabase = createServiceClient()
  const { data: conn } = await supabase
    .from('tiktok_connections')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle()
  if (!conn) return { token: null, error: 'TikTok não conectado para este cliente' }

  if (new Date(conn.access_expires_at).getTime() - Date.now() > 5 * 60 * 1000) {
    return { token: conn.access_token as string }
  }
  if (new Date(conn.refresh_expires_at).getTime() < Date.now()) {
    return { token: null, error: 'A conexão com o TikTok expirou. Conecte de novo em Integrações.' }
  }

  const t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: conn.refresh_token })
  if (!t.access_token || !t.refresh_token) {
    return { token: null, error: t.error_description ?? t.error ?? 'Falha ao renovar o token do TikTok' }
  }
  await saveConnection(clientId, { ...t, open_id: t.open_id ?? conn.open_id })
  return { token: t.access_token }
}

export async function tiktokPost(path: string, token: string, body: unknown) {
  const res = await fetch(`${TIKTOK_API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(body),
  })
  return res.json().catch(() => ({ error: { code: 'invalid_response', message: 'Resposta inválida do TikTok' } }))
}
