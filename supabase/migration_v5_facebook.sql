-- Migration v5: Facebook & Instagram Business integration fields

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS facebook_page_id      TEXT,
  ADD COLUMN IF NOT EXISTS facebook_page_token   TEXT,
  ADD COLUMN IF NOT EXISTS instagram_account_id  TEXT;

-- Colunas para guardar os IDs dos posts agendados (referência futura / edição / exclusão)
ALTER TABLE contents
  ADD COLUMN IF NOT EXISTS facebook_post_id  TEXT,
  ADD COLUMN IF NOT EXISTS instagram_post_id TEXT;

COMMENT ON COLUMN clients.facebook_page_id     IS 'ID numérico da página do Facebook Business do cliente';
COMMENT ON COLUMN clients.facebook_page_token  IS 'Page Access Token permanente da página do Facebook';
COMMENT ON COLUMN clients.instagram_account_id IS 'ID numérico da conta Instagram Business vinculada à página';
COMMENT ON COLUMN contents.facebook_post_id   IS 'ID do post agendado via Graph API no Facebook';
COMMENT ON COLUMN contents.instagram_post_id  IS 'ID do container publicado via Graph API no Instagram';
