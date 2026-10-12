-- Conexão do TikTok por cliente + resultado do envio de cada conteúdo.
--  tiktok_connections guarda os tokens OAuth (access vale ~24h e é renovado
--  sozinho; refresh vale ~365 dias). Contém segredo: só o servidor (service
--  role) lê. A agência não precisa de acesso direto, então não há policy.
create table if not exists tiktok_connections (
  client_id uuid primary key references clients(id) on delete cascade,
  open_id text not null,
  display_name text,
  access_token text not null,
  refresh_token text not null,
  access_expires_at timestamptz not null,
  refresh_expires_at timestamptz not null,
  scope text,
  updated_at timestamptz not null default now()
);

alter table tiktok_connections enable row level security;

alter table contents add column if not exists tiktok_publish_id text;
alter table contents add column if not exists tiktok_status text;
alter table contents add column if not exists tiktok_publish_error text;
