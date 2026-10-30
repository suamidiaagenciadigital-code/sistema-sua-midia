import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

// Integração Google Business Profile (OAuth da agência → posts nos perfis).
// Variáveis (Vercel): GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e, opcionais,
// GOOGLE_REDIRECT_URI e GOOGLE_TOKEN_ENCRYPTION_KEY (sem ela, a chave de
// criptografia sai do GOOGLE_CLIENT_SECRET — trocar o secret exige reconectar).

export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
export const GBP_SCOPE = 'https://www.googleapis.com/auth/business.manage'

export function googleKeys(): { id: string; secret: string } | null {
  const id = process.env.GOOGLE_CLIENT_ID
  const secret = process.env.GOOGLE_CLIENT_SECRET
  return id && secret ? { id, secret } : null
}

export function googleRedirectUri(): string {
  return process.env.GOOGLE_REDIRECT_URI ?? 'https://sistema.suamidia.com.br/api/google/callback'
}

// ── Criptografia do refresh token (AES-256-GCM) ──────────────────────────────

function encKey(): Buffer {
  const base = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY ?? process.env.GOOGLE_CLIENT_SECRET ?? ''
  return createHash('sha256').update(`gbp-token:${base}`).digest()
}

export function encryptToken(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encKey(), iv)
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), ct].map((b) => b.toString('base64')).join('.')
}

export function decryptToken(enc: string): string {
  const [iv, tag, ct] = enc.split('.').map((p) => Buffer.from(p, 'base64'))
  const decipher = createDecipheriv('aes-256-gcm', encKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
}

// ── OAuth ────────────────────────────────────────────────────────────────────

interface GoogleTokenResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  error?: string
  error_description?: string
}

async function tokenRequest(params: Record<string, string>): Promise<GoogleTokenResponse> {
  const keys = googleKeys()
  if (!keys) return { error: 'config', error_description: 'GOOGLE_CLIENT_ID/SECRET não configurados' }
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: keys.id, client_secret: keys.secret, ...params }),
  })
  return res.json().catch(() => ({ error: 'invalid_response' }))
}

export function exchangeGoogleCode(code: string) {
  return tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: googleRedirectUri() })
}

/** Guarda a conexão da agência (só existe uma): substitui a anterior. */
export async function saveGoogleConnection(refreshToken: string, scopes: string | null) {
  const supabase = createServiceClient()
  await supabase.from('google_connections').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  return supabase.from('google_connections').insert({
    refresh_token_encrypted: encryptToken(refreshToken),
    scopes,
    invalid: false,
  })
}

export async function getGoogleConnection() {
  const { data } = await createServiceClient()
    .from('google_connections')
    .select('id, scopes, invalid, created_at, updated_at')
    .limit(1)
    .maybeSingle()
  return data
}

/** Access token novo a cada chamada (não há cache: o Google responde rápido). */
export async function getGoogleAccessToken(): Promise<{ token: string | null; error?: string }> {
  const supabase = createServiceClient()
  const { data: conn } = await supabase
    .from('google_connections')
    .select('id, refresh_token_encrypted, invalid')
    .limit(1)
    .maybeSingle()
  if (!conn) return { token: null, error: 'Google não conectado. Conecte em Configurações.' }
  if (conn.invalid) return { token: null, error: 'A conexão com o Google expirou. Reconecte em Configurações.' }

  let refresh: string
  try {
    refresh = decryptToken(conn.refresh_token_encrypted)
  } catch {
    await supabase.from('google_connections').update({ invalid: true }).eq('id', conn.id)
    return { token: null, error: 'Não consegui ler a conexão com o Google (chave mudou). Reconecte em Configurações.' }
  }

  const t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: refresh })
  if (t.access_token) return { token: t.access_token }
  if (t.error === 'invalid_grant') {
    await supabase.from('google_connections').update({ invalid: true, updated_at: new Date().toISOString() }).eq('id', conn.id)
    return { token: null, error: 'O Google revogou o acesso. Reconecte em Configurações.' }
  }
  return { token: null, error: t.error_description ?? t.error ?? 'Falha ao renovar o acesso do Google' }
}

// ── Perfis (locations) ───────────────────────────────────────────────────────

export interface GbpLocation {
  accountId: string       // accounts/123
  accountName: string
  locationId: string      // locations/456
  title: string
}

async function gget(url: string, token: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, json }
}

export async function listGbpLocations(token: string): Promise<{ locations: GbpLocation[]; error?: string }> {
  const acc = await gget('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', token)
  if (!acc.ok) return { locations: [], error: acc.json?.error?.message ?? `Google respondeu ${acc.status}` }

  const out: GbpLocation[] = []
  for (const a of acc.json.accounts ?? []) {
    let pageToken = ''
    do {
      const url =
        `https://mybusinessbusinessinformation.googleapis.com/v1/${a.name}/locations` +
        `?readMask=name,title&pageSize=100${pageToken ? `&pageToken=${pageToken}` : ''}`
      const r = await gget(url, token)
      if (!r.ok) return { locations: out, error: r.json?.error?.message ?? `Google respondeu ${r.status}` }
      for (const l of r.json.locations ?? []) {
        out.push({ accountId: a.name, accountName: a.accountName ?? a.name, locationId: l.name, title: l.title ?? l.name })
      }
      pageToken = r.json.nextPageToken ?? ''
    } while (pageToken)
  }
  return { locations: out }
}

// ── Posts ────────────────────────────────────────────────────────────────────

export const GBP_CTA_TYPES = ['LEARN_MORE', 'BOOK', 'ORDER', 'SHOP', 'SIGN_UP', 'CALL'] as const

export interface GbpPostInput {
  accountId: string
  locationId: string
  summary: string
  imageUrl: string
  ctaType?: string | null
  ctaUrl?: string | null
}

export interface GbpPostResult {
  name: string | null
  state: string | null    // LIVE | PROCESSING | REJECTED
  error: string | null
  retryable: boolean
}

export async function createGbpPost(token: string, input: GbpPostInput): Promise<GbpPostResult> {
  const body: Record<string, unknown> = {
    languageCode: 'pt-BR',
    topicType: 'STANDARD',
    summary: input.summary,
    media: [{ mediaFormat: 'PHOTO', sourceUrl: input.imageUrl }],
  }
  const cta = input.ctaType
  if (cta === 'CALL') body.callToAction = { actionType: 'CALL' }
  else if (cta && input.ctaUrl) body.callToAction = { actionType: cta, url: input.ctaUrl }

  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${input.accountId}/${input.locationId}/localPosts`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  const json = await res.json().catch(() => ({}))
  if (res.ok && json.name) return { name: json.name, state: json.state ?? null, error: null, retryable: false }
  return {
    name: null,
    state: null,
    error: json?.error?.message ?? `Google respondeu ${res.status}`,
    retryable: res.status === 429 || res.status >= 500,
  }
}

// ── Vídeo (galeria do perfil) ────────────────────────────────────────────────
// A API de posts só aceita foto; vídeo entra pela API de mídia, na galeria do
// perfil (sem legenda nem botão). Limites do Google: 30 s, 75 MB, 720p+ —
// usamos 26 MB por segurança, que é o valor publicado nas diretrizes.

export const GBP_VIDEO_MAX_SECONDS = 30
export const GBP_VIDEO_MAX_BYTES = 26 * 1024 * 1024

/** Duração (s) de um MP4 lida do átomo mvhd; null se não achar. */
export function mp4DurationSeconds(buf: Buffer): number | null {
  const i = buf.indexOf('mvhd')
  if (i < 0 || i + 24 > buf.length) return null
  const version = buf[i + 4]
  if (version === 1) {
    if (i + 36 > buf.length) return null
    const timescale = buf.readUInt32BE(i + 24)
    const duration = Number(buf.readBigUInt64BE(i + 28))
    return timescale ? duration / timescale : null
  }
  const timescale = buf.readUInt32BE(i + 16)
  const duration = buf.readUInt32BE(i + 20)
  return timescale ? duration / timescale : null
}

/** Confere tamanho e duração do vídeo. `reason` vem preenchido quando não serve. */
export async function checkGbpVideo(url: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    const head = await fetch(url, { method: 'HEAD' })
    const size = Number(head.headers.get('content-length') ?? 0)
    if (size > GBP_VIDEO_MAX_BYTES) {
      return { ok: false, reason: `Vídeo grande demais para o Google (${(size / 1048576).toFixed(0)} MB; máx. 26 MB)` }
    }
    const res = await fetch(url)
    if (!res.ok) return { ok: false, reason: `Não consegui baixar o vídeo (${res.status})` }
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length > GBP_VIDEO_MAX_BYTES) {
      return { ok: false, reason: `Vídeo grande demais para o Google (${(buf.length / 1048576).toFixed(0)} MB; máx. 26 MB)` }
    }
    const secs = mp4DurationSeconds(buf)
    if (secs == null) return { ok: false, reason: 'Não consegui ler a duração do vídeo' }
    if (secs > GBP_VIDEO_MAX_SECONDS) {
      return { ok: false, reason: `Vídeo com ${Math.round(secs)} s (o Google aceita até ${GBP_VIDEO_MAX_SECONDS} s)` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: String((e as Error)?.message ?? e) }
  }
}

export async function createGbpVideo(
  token: string,
  input: { accountId: string; locationId: string; videoUrl: string },
): Promise<GbpPostResult> {
  const res = await fetch(`https://mybusiness.googleapis.com/v4/${input.accountId}/${input.locationId}/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mediaFormat: 'VIDEO',
      locationAssociation: { category: 'ADDITIONAL' },
      sourceUrl: input.videoUrl,
    }),
  })
  const json = await res.json().catch(() => ({}))
  if (res.ok && json.name) return { name: json.name, state: null, error: null, retryable: false }
  return {
    name: null,
    state: null,
    error: json?.error?.message ?? `Google respondeu ${res.status}`,
    retryable: res.status === 429 || res.status >= 500,
  }
}

export async function deleteGbpPost(token: string, postName: string): Promise<boolean> {
  const res = await fetch(`https://mybusiness.googleapis.com/v4/${postName}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.ok
}
