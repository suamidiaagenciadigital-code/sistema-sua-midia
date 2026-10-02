-- Resumo mensal do portal do cliente (um registro por cliente e mês).
--  snapshot  = última leitura automática do Instagram (cache + histórico: o
--              Instagram só devolve ~30 dias, então guardar é o que permite
--              comparar com o mês anterior depois).
--  overrides = números digitados pela agência — têm prioridade sobre o
--              automático (modo "híbrido"); também é onde entram os dados de
--              anúncios, que a API não consegue ler sem permissão do cliente.
create table if not exists monthly_reports (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  overrides jsonb not null default '{}'::jsonb,
  snapshot jsonb not null default '{}'::jsonb,
  snapshot_at timestamptz,
  note text,
  highlight text,
  updated_at timestamptz not null default now(),
  unique (client_id, month)
);

alter table monthly_reports enable row level security;

-- Só a agência lê/escreve direto. O portal do cliente lê pelo servidor (service
-- role), então um cliente logado não consegue consultar esta tabela com o
-- próprio token.
create policy "Agência acessa monthly_reports" on monthly_reports
  for all
  using (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'agency') <> 'client')
  with check (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'agency') <> 'client');
