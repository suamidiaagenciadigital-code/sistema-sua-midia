-- Migration v2: token de aprovação pública por cliente
-- Execute no SQL Editor do Supabase

alter table clients add column if not exists approval_token uuid default uuid_generate_v4();

-- Política pública: leitura do conteúdo via token (sem auth)
create policy "public approval read" on contents
  for select to anon
  using (
    exists (
      select 1 from clients
      where clients.id = contents.client_id
        and clients.approval_token::text = current_setting('request.headers', true)::json->>'x-approval-token'
    )
  );
