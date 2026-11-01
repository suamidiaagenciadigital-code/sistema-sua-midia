-- Migration v21: marca os posts aprovados automaticamente (cliente não aprovou
-- até 30 min antes do horário). O cron de publicação funciona sem esta coluna;
-- ela só serve para saber quem aprovou de verdade e quem foi pelo prazo.
alter table contents add column if not exists auto_approved boolean not null default false;
