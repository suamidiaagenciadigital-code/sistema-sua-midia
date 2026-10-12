-- Migration v15: acesso às tabelas SÓ para a agência (RLS seguro)
--
-- Problema: as policies antigas liberavam TUDO para qualquer usuário logado
-- ("authenticated full access", using true) ou decidiam o papel por
-- user_metadata, que o próprio usuário consegue editar. Um cliente do portal
-- (também "authenticated") conseguia, com a chave pública do Supabase, ler e
-- alterar tabelas de outros clientes (inclusive tokens da Meta).
--
-- Agora o papel vem de app_metadata.role = 'agency', que só o servidor grava.
-- O portal do cliente lê tudo pelo servidor (service role), então não é afetado.
--
-- ANTES de rodar: o código novo já precisa estar no ar e a agência precisa ter
-- saído e entrado de novo no sistema (o papel novo só entra no token ao logar).
--
-- ROLLBACK (se o painel travar): rodar o bloco "ROLLBACK" no fim deste arquivo.

create or replace function public.is_agency() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'agency'
$$;

-- clients, contents, media, support_tickets, ad_campaigns
drop policy if exists "authenticated full access" on clients;
drop policy if exists "authenticated full access" on contents;
drop policy if exists "authenticated full access" on media;
drop policy if exists "authenticated full access" on support_tickets;
drop policy if exists "authenticated full access" on ad_campaigns;

create policy "agency only" on clients         for all to authenticated using (public.is_agency()) with check (public.is_agency());
create policy "agency only" on contents        for all to authenticated using (public.is_agency()) with check (public.is_agency());
create policy "agency only" on media           for all to authenticated using (public.is_agency()) with check (public.is_agency());
create policy "agency only" on support_tickets for all to authenticated using (public.is_agency()) with check (public.is_agency());
create policy "agency only" on ad_campaigns    for all to authenticated using (public.is_agency()) with check (public.is_agency());

-- proposals, drive_imports, monthly_reports
drop policy if exists "Agency manages proposals" on proposals;
drop policy if exists "Agência acessa drive_imports" on drive_imports;
drop policy if exists "Agência acessa monthly_reports" on monthly_reports;

create policy "agency only" on proposals       for all to authenticated using (public.is_agency()) with check (public.is_agency());
create policy "agency only" on drive_imports   for all to authenticated using (public.is_agency()) with check (public.is_agency());
create policy "agency only" on monthly_reports for all to authenticated using (public.is_agency()) with check (public.is_agency());

-- A policy "public approval read" (leitura anônima por token) NÃO é alterada.

/* ROLLBACK — volta ao estado anterior (menos seguro). Só em emergência:

drop policy if exists "agency only" on clients;
drop policy if exists "agency only" on contents;
drop policy if exists "agency only" on media;
drop policy if exists "agency only" on support_tickets;
drop policy if exists "agency only" on ad_campaigns;
drop policy if exists "agency only" on proposals;
drop policy if exists "agency only" on drive_imports;
drop policy if exists "agency only" on monthly_reports;

create policy "authenticated full access" on clients         for all to authenticated using (true) with check (true);
create policy "authenticated full access" on contents        for all to authenticated using (true) with check (true);
create policy "authenticated full access" on media           for all to authenticated using (true) with check (true);
create policy "authenticated full access" on support_tickets for all to authenticated using (true) with check (true);
create policy "authenticated full access" on ad_campaigns    for all to authenticated using (true) with check (true);
create policy "Agency manages proposals"      on proposals       for all using (true) with check (true);
create policy "Agência acessa drive_imports"  on drive_imports   for all using (true) with check (true);
create policy "Agência acessa monthly_reports" on monthly_reports for all using (true) with check (true);
*/
