-- ============================================================
-- Migration v4 — Cenas de Reel e Cards de Carrossel
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Estrutura de cenas para Reels (array de objetos)
-- Exemplo: [{"scene":1,"visual_prompt":"...","narration":"..."}]
alter table contents
  add column if not exists reel_scenes jsonb;

-- Estrutura de cards para Carrosséis (array de objetos)
-- Exemplo: [{"card":1,"hook":"...","image_prompt":"...","caption":"..."}]
alter table contents
  add column if not exists carousel_cards jsonb;

-- Índice GIN para consultas eficientes nos campos jsonb (opcional)
create index if not exists idx_contents_reel_scenes on contents using gin(reel_scenes);
create index if not exists idx_contents_carousel_cards on contents using gin(carousel_cards);
