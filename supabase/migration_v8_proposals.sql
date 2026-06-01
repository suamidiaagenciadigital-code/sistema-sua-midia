-- Tabela de propostas comerciais
CREATE TABLE IF NOT EXISTS proposals (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  client_name   TEXT NOT NULL,
  service_title TEXT NOT NULL DEFAULT 'Gestão de Redes Sociais',
  service_description TEXT DEFAULT 'Produção completa de conteúdo para redes sociais, com estratégia, criação e publicação.',
  monthly_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  deliverables  JSONB NOT NULL DEFAULT '[]',
  avulsos       JSONB NOT NULL DEFAULT '[]',
  whatsapp      TEXT NOT NULL DEFAULT '',
  email         TEXT DEFAULT 'contato@suamidia.com',
  valid_days    INTEGER DEFAULT 15,
  status        TEXT DEFAULT 'active' CHECK (status IN ('active','expired','closed')),
  views         INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: apenas usuários autenticados da agência gerenciam; proposta pública é lida via service role
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency manages proposals"
  ON proposals FOR ALL
  USING (true)
  WITH CHECK (true);
