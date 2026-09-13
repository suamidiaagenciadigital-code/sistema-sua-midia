-- O cron de importação do Drive agora reivindica o arquivo (INSERT) antes de
-- processar, não depois — a constraint única de drive_json_file_id vira a
-- trava real contra reprocessamento (o SELECT antigo podia falhar sob
-- concorrência e duplicar conteúdo a cada execução). Isso exige um status
-- intermediário "processing" enquanto o processamento ainda não terminou.
alter table drive_imports drop constraint if exists drive_imports_status_check;
alter table drive_imports add constraint drive_imports_status_check
  check (status in ('processing', 'imported', 'skipped', 'error'));
