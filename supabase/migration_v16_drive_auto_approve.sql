-- Aprovação automática das publicações importadas do Drive.
-- Quando ligado para um cliente, o que o cron do Drive importa já entra como
-- "aprovado" (approved_by_client) e vai direto para a fila de publicação, sem
-- passar pelo link de aprovação. Pensado para a própria Sua Mídia, onde o que
-- é colocado no Drive já está aprovado internamente. Desligado por padrão.
alter table clients add column if not exists drive_auto_approve boolean not null default false;

-- Liga só para a Sua Mídia
update clients set drive_auto_approve = true where id = '439771d0-01e3-4b9d-88d9-1a1c1e37e41a';
