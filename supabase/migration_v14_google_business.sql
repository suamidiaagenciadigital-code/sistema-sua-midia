-- Google Business Profile: conexão OAuth da agência + vínculo cliente → perfil
-- + resultado da publicação de cada post.
--
-- google_connections guarda o refresh token CRIPTOGRAFADO (AES-256-GCM, feito no
-- servidor). Só o servidor (service role) lê: RLS ligado e sem nenhuma policy.
create table if not exists google_connections (
  id uuid primary key default uuid_generate_v4(),
  google_email text,
  refresh_token_encrypted text not null,
  scopes text,
  invalid boolean not null default false,   -- true quando o Google devolveu invalid_grant
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table google_connections enable row level security;

-- Cliente ↔ perfil do Google. Desligado por padrão: nada muda até alguém ligar.
alter table clients add column if not exists gbp_account_id text;     -- accounts/123
alter table clients add column if not exists gbp_location_id text;    -- locations/456
alter table clients add column if not exists gbp_location_title text; -- só para exibir
alter table clients add column if not exists gbp_enabled boolean not null default false;
alter table clients add column if not exists gbp_cta_type text not null default 'LEARN_MORE';
alter table clients add column if not exists gbp_cta_url text;        -- site ou wa.me/55...

-- Resultado por post
alter table contents add column if not exists publish_to_gbp boolean not null default true;
alter table contents add column if not exists gbp_post_name text;     -- accounts/x/locations/y/localPosts/z
alter table contents add column if not exists gbp_status text;        -- published | failed | skipped
alter table contents add column if not exists gbp_error text;
alter table contents add column if not exists gbp_published_at timestamptz;
