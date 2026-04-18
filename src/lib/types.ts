export type ClientStatus = 'ativo' | 'pausado' | 'encerrado'
export type VisualStyle = 'escuro' | 'claro' | 'colorido' | 'minimalista'

export interface Partner {
  name: string
  instagram: string
  how_to_use: string
}

export interface Location {
  name: string
  address: string
}

export interface SocialLink {
  platform: string
  url: string
}

export interface Client {
  id: string
  name: string
  niche: string
  slogan?: string
  target_audience: string
  pain_points: string
  differentials: string
  tone_of_voice: string
  brand_keywords?: string[]
  forbidden_words?: string[]
  visual_references?: string
  monthly_goal: string
  contracted_services: string
  ad_budget?: string
  success_metrics?: string
  revision_limit?: string
  extra_values?: string
  partners?: Partner[]
  catalog?: string
  ai_notes?: string
  logo_url?: string
  brand_guide_url?: string
  brand_colors?: string[]
  brand_fonts?: string
  visual_style?: VisualStyle
  visual_mandatory?: string
  visual_forbidden?: string
  approved_examples_urls?: string[]
  locations?: Location[]
  social_links?: SocialLink[]
  status: ClientStatus
  whatsapp_group_jid?: string | null
  approval_token?: string | null
  facebook_page_id?: string | null
  facebook_page_token?: string | null
  instagram_account_id?: string | null
  created_at: string
  updated_at: string
}
