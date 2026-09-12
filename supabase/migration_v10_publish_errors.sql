-- Guarda o erro real da última tentativa de publicação em cada rede.
-- Sem isso, quando Facebook/Instagram falha, o status vira "published" do
-- mesmo jeito e a causa real se perde — só dava pra investigar durante a
-- própria tentativa (log do Vercel), nunca depois.
alter table contents add column if not exists facebook_publish_error text;
alter table contents add column if not exists instagram_publish_error text;
