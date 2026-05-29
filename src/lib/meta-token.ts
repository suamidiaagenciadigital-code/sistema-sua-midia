/**
 * Retorna o token da Meta para publicação.
 * Prioridade: token salvo por cliente no banco
 * Fallback: variável de ambiente FACEBOOK_SYSTEM_TOKEN (global)
 */
export function getMetaToken(clientToken?: string | null): string {
  return clientToken ?? process.env.FACEBOOK_SYSTEM_TOKEN ?? ''
}
