-- Código curto para o link de aprovação.
-- O link antigo usa o approval_token (UUID). Um UUID tem o mesmo formato de uma
-- chave Pix aleatória, e o WhatsApp o reconhece como "chave Pix": o código vira
-- um botão de copiar e o resto do endereço deixa de ser link. O código curto
-- (8 caracteres, começa com letra) não tem esse formato. Os links antigos com
-- UUID continuam funcionando.
alter table clients add column if not exists approval_code text;

update clients
   set approval_code = 'a' || substr(md5(random()::text || clock_timestamp()::text || id::text), 1, 7)
 where approval_code is null;

create unique index if not exists clients_approval_code_key on clients (approval_code);

alter table clients alter column approval_code
  set default ('a' || substr(md5(random()::text || clock_timestamp()::text), 1, 7));
