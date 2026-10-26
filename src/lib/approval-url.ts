// Endereço oficial do sistema (mesmo domínio usado no login e nos crons).
export const SITE_URL = 'https://sistema.suamidia.com.br'

/**
 * Link de aprovação do cliente. Prefere o código curto (approval_code): o
 * approval_token é um UUID, e o WhatsApp o confunde com uma chave Pix e quebra
 * o link. Sem o código curto (migration_v17 pendente), cai no token antigo.
 */
export function approvalUrl(code?: string | null, token?: string | null): string | null {
  const key = code || token
  return key ? `${SITE_URL}/approve/${key}` : null
}
