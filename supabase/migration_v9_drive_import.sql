-- Importação automática do Drive: cada cliente tem uma pasta raiz opcional
-- (a pasta do "MÊS", contendo subpastas DD-MM) que o cron varre diariamente.
alter table clients add column if not exists drive_folder_id text;

-- Log das importações — tanto sucesso quanto pulados pela trava de segurança.
-- Alimenta o card "Importações pendentes" no dashboard.
create table if not exists drive_imports (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  drive_json_file_id text not null,      -- ID do arquivo .json no Drive (evita reprocessar)
  folder_name text,                       -- ex: "09-09", pra exibir no aviso
  status text not null check (status in ('imported', 'skipped', 'error')),
  reason text,                            -- por que foi pulado/erro, quando aplicável
  content_id uuid references contents(id) on delete set null,
  created_at timestamptz default now()
);

create unique index if not exists drive_imports_json_file_unique
  on drive_imports(drive_json_file_id);

create index if not exists drive_imports_status_idx on drive_imports(status);

alter table drive_imports enable row level security;
create policy "Agência acessa drive_imports" on drive_imports
  for all using (true) with check (true);
