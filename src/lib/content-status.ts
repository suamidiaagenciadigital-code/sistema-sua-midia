export type ContentStatus =
  | 'draft'
  | 'pending_my_approval'
  | 'approved_by_me'
  | 'sent_to_client'
  | 'approved_by_client'
  | 'published'
  | 'revision'

export const STATUS_LABEL: Record<ContentStatus, string> = {
  draft: 'Rascunho',
  pending_my_approval: 'Aguardando minha aprovação',
  approved_by_me: 'Aprovado por mim',
  sent_to_client: 'Enviado ao cliente',
  approved_by_client: 'Aprovado pelo cliente',
  published: 'Publicado',
  revision: 'Revisar',
}

export const STATUS_COLOR: Record<ContentStatus, string> = {
  draft: 'bg-zinc-700 text-zinc-300 border-zinc-600',
  pending_my_approval: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  approved_by_me: 'bg-blue-900/50 text-blue-300 border-blue-700',
  sent_to_client: 'bg-orange-900/50 text-orange-300 border-orange-700',
  approved_by_client: 'bg-green-900/50 text-green-300 border-green-700',
  published: 'bg-emerald-900/60 text-emerald-200 border-emerald-700',
  revision: 'bg-red-900/50 text-red-300 border-red-700',
}

export const STATUS_DOT: Record<ContentStatus, string> = {
  draft: 'bg-zinc-500',
  pending_my_approval: 'bg-yellow-400',
  approved_by_me: 'bg-blue-400',
  sent_to_client: 'bg-orange-400',
  approved_by_client: 'bg-green-400',
  published: 'bg-emerald-400',
  revision: 'bg-red-400',
}

export const TYPE_LABEL: Record<string, string> = {
  reel: 'Reel',
  carrossel: 'Carrossel',
  imagem: 'Imagem',
  story: 'Story',
}

export const TYPE_ICON: Record<string, string> = {
  reel: '🎬',
  carrossel: '📋',
  imagem: '🖼',
  story: '⚡',
}
