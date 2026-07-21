-- Migration v7: portal do cliente
-- Execute no Supabase SQL Editor

-- Vincula um usuário do Supabase Auth ao cliente (acesso ao portal)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS portal_user_id UUID DEFAULT NULL REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN clients.portal_user_id IS 'ID do usuário Supabase Auth criado para acesso ao portal do cliente';
