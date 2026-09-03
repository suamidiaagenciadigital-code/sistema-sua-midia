/**
 * google-drive.ts
 *
 * Acesso à Drive API v3 via conta de serviço (Service Account), sem
 * dependências externas — assina o JWT com o módulo `crypto` nativo do Node
 * e troca por um access_token OAuth2, seguindo o fluxo padrão do Google.
 *
 * Credencial: variável de ambiente GOOGLE_SERVICE_ACCOUNT_KEY, com o JSON
 * completo da chave da conta de serviço (baixado no Google Cloud Console).
 *
 * Usado pela importação automática do Drive — ver
 * src/app/api/cron/drive-import/route.ts
 */

import { createSign } from 'crypto'

const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/drive.readonly'

interface ServiceAccountKey {
  client_email: string
  private_key: string
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
}

let cachedToken: { value: string; expiresAt: number } | null = null

function getServiceAccount(): ServiceAccountKey {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY não configurada')
  return JSON.parse(raw)
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** Assina o JWT da conta de serviço e troca por um access_token OAuth2. */
async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value
  }

  const sa = getServiceAccount()
  const now = Math.floor(Date.now() / 1000)

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }))

  const signInput = `${header}.${claims}`
  const signer = createSign('RSA-SHA256')
  signer.update(signInput)
  signer.end()
  const signature = base64url(signer.sign(sa.private_key))

  const jwt = `${signInput}.${signature}`

  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Falha ao autenticar com o Google: ${text}`)
  }

  const data = await resp.json()
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return cachedToken.value
}

async function driveGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const token = await getAccessToken()
  const url = new URL(`${DRIVE_API}${path}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Drive API ${resp.status}: ${text}`)
  }
  return resp.json()
}

/** Lista as subpastas diretas de um folder. */
export async function listSubfolders(folderId: string): Promise<DriveFile[]> {
  const data = await driveGet<{ files: DriveFile[] }>('/files', {
    q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id,name,mimeType)',
    pageSize: '200',
  })
  return data.files ?? []
}

/** Lista todos os arquivos (não-pasta) dentro de um folder. */
export async function listFiles(folderId: string): Promise<DriveFile[]> {
  const data = await driveGet<{ files: DriveFile[] }>('/files', {
    q: `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id,name,mimeType)',
    pageSize: '200',
  })
  return data.files ?? []
}

/** Baixa o conteúdo de um arquivo (usado para ler o .json de configuração). */
export async function downloadFileContent(fileId: string): Promise<string> {
  const token = await getAccessToken()
  const resp = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!resp.ok) throw new Error(`Falha ao baixar arquivo ${fileId}: ${resp.status}`)
  return resp.text()
}

/** Renomeia um arquivo — usado para marcar o .json como já processado. */
export async function renameFile(fileId: string, newName: string): Promise<void> {
  const token = await getAccessToken()
  const resp = await fetch(`${DRIVE_API}/files/${fileId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName }),
  })
  if (!resp.ok) throw new Error(`Falha ao renomear arquivo ${fileId}: ${resp.status}`)
}

/** URL pública direta de um arquivo do Drive, no mesmo padrão usado no resto do sistema. */
export function publicFileUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`
}
