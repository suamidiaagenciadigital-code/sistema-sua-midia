-- ============================================================
-- Migration v3 — WhatsApp Group JID nos clientes
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Adiciona campo para armazenar o JID do grupo WhatsApp do cliente
-- Exemplo de valor: 5562999999999-1234567890@g.us
alter table clients
  add column if not exists whatsapp_group_jid text;
