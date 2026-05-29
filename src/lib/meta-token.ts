/**
 * Retorna o token do Usuário do Sistema da Meta.
 * Prioridade: variável de ambiente FACEBOOK_SYSTEM_TOKEN (global)
 * Fallback: token salvo por cliente no banco (legado)
 */
export function getMetaToken(clientToken?: string | null): string {
  return process.env.FACEBOOK_SYSTEM_TOKEN ?? clientToken ?? ''
}
