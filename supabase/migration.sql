-- ============================================================
-- Sistema Sua Mídia — Migration v1
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Habilitar extensão UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABELA: clients
-- ============================================================
create table if not exists clients (
  id                    uuid primary key default uuid_generate_v4(),
  name                  text not null,
  niche                 text not null,
  slogan                text,
  target_audience       text not null,
  pain_points           text not null,
  differentials         text not null,
  tone_of_voice         text not null,
  brand_keywords        text[],
  forbidden_words       text[],
  visual_references     text,
  monthly_goal          text not null,
  contracted_services   text not null,
  ad_budget             text,
  success_metrics       text,
  revision_limit        text,
  extra_values          text,
  partners              jsonb,
  catalog               text,
  ai_notes              text,
  logo_url              text,
  brand_guide_url       text,
  brand_colors          text[],
  brand_fonts           text,
  visual_style          text check (visual_style in ('escuro', 'claro', 'colorido', 'minimalista')),
  visual_mandatory      text,
  visual_forbidden      text,
  approved_examples_urls text[],
  locations             jsonb,
  social_links          jsonb,
  status                text not null default 'ativo' check (status in ('ativo', 'pausado', 'encerrado')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ============================================================
-- TABELA: contents
-- ============================================================
create table if not exists contents (
  id                    uuid primary key default uuid_generate_v4(),
  client_id             uuid not null references clients(id) on delete cascade,
  type                  text not null check (type in ('reel', 'carrossel', 'imagem', 'story')),
  title                 text not null,
  caption               text,
  script                text,
  image_prompt          text,
  cta                   text,
  partner_mentioned     text,
  scheduled_date        date,
  status                text not null default 'draft' check (status in (
    'draft', 'pending_my_approval', 'approved_by_me',
    'sent_to_client', 'approved_by_client', 'published', 'revision'
  )),
  media_urls            text[],
  generated_image_url   text,
  generated_video_url   text,
  video_type            text check (video_type in ('auto', 'maker')),
  visual_prompt_used    text,
  revision_notes        text,
  revision_count        int not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ============================================================
-- TABELA: media
-- ============================================================
create table if not exists media (
  id            uuid primary key default uuid_generate_v4(),
  client_id     uuid not null references clients(id) on delete cascade,
  file_url      text not null,
  file_type     text not null check (file_type in ('image', 'video', 'pdf', 'other')),
  tags          text[],
  original_name text,
  size_bytes    bigint,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- TABELA: support_tickets
-- ============================================================
create table if not exists support_tickets (
  id                    uuid primary key default uuid_generate_v4(),
  client_id             uuid not null references clients(id) on delete cascade,
  original_message      text not null,
  classification        text check (classification in ('pedido', 'queixa', 'elogio', 'duvida', 'extra', 'urgente')),
  ai_suggested_response text,
  final_response        text,
  status                text not null default 'open' check (status in ('open', 'responded', 'closed')),
  created_at            timestamptz not null default now()
);

-- ============================================================
-- TABELA: ad_campaigns
-- ============================================================
create table if not exists ad_campaigns (
  id                  uuid primary key default uuid_generate_v4(),
  client_id           uuid not null references clients(id) on delete cascade,
  objective           text not null,
  budget              text,
  period              text,
  strategy            text,
  copies              jsonb,
  audience_suggestion text,
  status              text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed')),
  created_at          timestamptz not null default now()
);

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger clients_updated_at
  before update on clients
  for each row execute function update_updated_at();

create trigger contents_updated_at
  before update on contents
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table clients        enable row level security;
alter table contents       enable row level security;
alter table media          enable row level security;
alter table support_tickets enable row level security;
alter table ad_campaigns   enable row level security;

-- Política: usuário autenticado tem acesso total (sistema interno, 1 usuário)
create policy "authenticated full access" on clients
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on contents
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on media
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on support_tickets
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on ad_campaigns
  for all to authenticated using (true) with check (true);

-- ============================================================
-- STORAGE BUCKETS (execute separado no dashboard do Supabase)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('logos', 'logos', true);
-- insert into storage.buckets (id, name, public) values ('media', 'media', false);
-- insert into storage.buckets (id, name, public) values ('creatives', 'creatives', false);
