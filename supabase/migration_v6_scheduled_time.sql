-- Migration v6: adicionar campo scheduled_time na tabela contents
-- Execute no Supabase SQL Editor

ALTER TABLE contents
  ADD COLUMN IF NOT EXISTS scheduled_time VARCHAR(5) DEFAULT NULL;

COMMENT ON COLUMN contents.scheduled_time IS 'Hora de publicação no formato HH:MM (ex: 09:00). Null = padrão do n8n.';
