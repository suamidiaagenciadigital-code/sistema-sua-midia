-- ============================================================
-- SEED: Don Barbearia — Primeiro cliente real
-- Execute no SQL Editor do Supabase
-- ============================================================

INSERT INTO clients (
  name,
  niche,
  slogan,
  target_audience,
  pain_points,
  differentials,
  tone_of_voice,
  brand_keywords,
  forbidden_words,
  visual_references,
  monthly_goal,
  contracted_services,
  ad_budget,
  success_metrics,
  revision_limit,
  extra_values,
  partners,
  catalog,
  ai_notes,
  brand_colors,
  brand_fonts,
  visual_style,
  visual_mandatory,
  visual_forbidden,
  locations,
  social_links,
  status
) VALUES (
  'Don Barbearia',

  'Barbearia masculina conceito/premium - posicionada como experiência de lifestyle, não apenas corte de cabelo',

  'Viva a vida como um Don.',

  'Homens 22-45 anos, classes B/A, Goiânia. Valorizam estilo, autoestima e experiências premium. Ligados a lifestyle, cultura, esporte e inovação. Frequentadores do Setor Marista e Alphaville.',

  '- Não encontram barbearia que entenda corte moderno + experiência
- Querem um espaço masculino que vá além do corte (cerveja, resenha, lifestyle)
- Noivos buscam preparação especial com os padrinhos
- Dificuldade de agendar em horários convenientes',

  '- Posicionamento lifestyle (não é salão, é experiência)
- Ambiente com música, cerveja artesanal (patrocínio Corona)
- Parcerias premium (Harley-Davidson, Evoke)
- Referências ao Poderoso Chefão (Don)
- Dia DON Noivo (3 pacotes: Sonny, Fredo, Vito)
- Auto-agendamento online
- Venda de óculos Evoke e cosméticos
- Playlist Don no Spotify',

  'Masculino, confiante, com atitude. Mistura sofisticação com descontração. Usa "Don" como identidade - não é arrogante, é seguro de si. Linguagem direta, sem frescura, com toques de humor e referências culturais (cinema, música, esporte). Nunca piegas, nunca formal demais.',

  ARRAY['#EstiloDon', 'Experiência', 'Melhor versão', 'Contemporâneo', 'Atitude', 'Lifestyle', 'Resenha'],

  ARRAY['salão', 'unissex', 'promoção', 'baratinho', 'aproveite', 'corram', 'últimas vagas'],

  'Tons escuros, preto e dourado. Ambiente premium. Fotos com iluminação dramática. Estética cinematográfica (Poderoso Chefão). Logo dourado sobre fundo escuro.',

  '- Aumentar agendamentos online em 30%
- Divulgar o Dia DON Noivo
- Divulgar os pacotes SEM falar preços
- Lotar a agenda das 2 unidades',

  '- 6 publicações/semana: 2 reels + 1 carrossel + 3 imagens
- Video maker 1x/mês em cada unidade
- Máscara WhatsApp Business (automática via atendentes):
  * Avaliação pós-atendimento
  * Convite para reagendamento (15 dias)
  * Feliz aniversário (anual)',

  'Atual: R$500/mês Google Ads | Planejado: +R$500/mês Meta Ads (total R$1.000/mês)',

  '- Agendamentos via link (programa da barbearia)
- Agendamentos via WhatsApp
- Links no site e na bio do Instagram
- Aumento de seguidores',

  '2 rodadas de revisão por entrega semanal',

  '- Post adicional: R$50
- Story extra: R$40
- Material gráfico: R$50
- Demais demandas: repassar para equipe da Sua Mídia',

  '[
    {"name": "Corona", "instagram": "@coronabrasil", "how_to_use": "Fotos e reels de bastidores com Corona na mão. Conteúdo Experiência Don: corte + cerveja + resenha. NUNCA associar com consumo excessivo."},
    {"name": "Manakai Sport & Lifestyle", "instagram": "@manakaioficial", "how_to_use": "Conteúdo cruzado: Antes do jogo, passa na Don / Estilo dentro e fora da quadra. Público compartilhado: homens 25-45, ativos, classe B/A."},
    {"name": "Evoke Eyewear", "instagram": "@evoke", "how_to_use": "Posts de produto: Saiu da cadeira com estilo. Óculos Evoke disponíveis na Don. Fotos de clientes usando Evoke após o corte. Venda sob consulta via WhatsApp."},
    {"name": "Harley-Davidson Goiânia", "instagram": "@harleydavidsongoiania", "how_to_use": "Conteúdo aspiracional: Do corte ao asfalto. Estilo Don. Fotos com motos Harley na frente da barbearia. Eventos conjuntos."},
    {"name": "Instituto Oliveira", "instagram": "@institutooliveira", "how_to_use": "Conteúdo de saúde masculina: Cuidar de fora é na Don. Cuidar de dentro é no Instituto Oliveira. Dicas cruzadas: nutrição para cabelo/barba saudável."},
    {"name": "Louvada Goiânia", "instagram": "@louvadagoiania", "how_to_use": "Parceiro mais integrado ao dia-a-dia da Don. Cerveja artesanal vendida NA Don. Reels de bastidores: barbeiro cortando + cliente tomando Louvada. Stories de cardápio. NUNCA associar com consumo excessivo."}
  ]'::jsonb,

  'CORTE E BARBA: Corte | Corte infantil | Corte máquina | Pé do cabelo | Barba | Barba terapia

ESTÉTICA MASCULINA: Depilação masculina | Selagem | Design de sobrancelha | Coloração | Descoloração | Cover | Hidratação

BEM-ESTAR: Massagem relaxante | Terapêutica | Miofacial/Desportiva | Capilar | Reflexologia podal | Ventosaterapia

DIA DON NOIVO:
- Pacote Sonny (básico): corte, barba, cerveja
- Pacote Fredo (intermediário): corte, barba, massagem, cerveja
- Pacote Vito (completo): corte, barba, massagem, maquiagem masculina, cerveja, ambiente exclusivo
(NUNCA divulgar preços dos pacotes — apenas informar que existem e direcionar para WhatsApp)

PACOTES FIDELIZAÇÃO (NUNCA divulgar preços, apenas existência):
- 5 Barbas | 3 Cortes | 4 Cortes máquina | 4 Massagens | Don 1 | Don 2 | Don 3

BEBIDAS:
- Cervejas Louvada: Pilsen R$10, German Pilsner R$12, Hoplager R$12, IPA R$20
- Destilados: Jack Daniels/Old Parr dose R$25
- Café Nespresso R$7
- +30 petiscos e chocolates

ÓCULOS EVOKE: +16 modelos sob consulta via WhatsApp | Collab Henrique Fogaça x Shelby

COSMÉTICOS: Shampoos (Don Alcides, B.Urb, Bucks, Panta Creme, Ferus) | Balms | Pomadas | Tratamento capilar',

  '1. NUNCA divulgar preços dos pacotes de fidelização. Apenas comunicar que existem e direcionar para o WhatsApp.
2. Sempre usar o termo "Don" como identidade. Ex: "Estilo Don", "Dia Don Noivo", "Viva como um Don".
3. Alternar conteúdo entre as 4 verticais: serviços de barbearia, bebidas/lifestyle, produtos (óculos e cosméticos), e pacotes/promoções.
4. Reels devem ter gancho forte nos primeiros 2 segundos. Tom cinematográfico, referências ao Poderoso Chefão quando couber.
5. Carrosseis devem ser educativos ou comparativos (ex: "5 erros que acabam com sua barba", "Corte degradê vs. corte clássico").
6. Imagens de feed devem seguir a estética escura/dourada. Nunca fundos brancos ou pasteis.
7. Sempre incluir CTA direcionando para agendamento (link ou WhatsApp). Nunca post sem CTA.
8. Conteúdo sobre o Dia DON Noivo deve ser puxado especialmente em períodos de alta de casamentos (maio-junho, outubro-novembro).
9. Nas máscaras de WhatsApp: manter tom amigável e direto, sem formalidade. "E aí, Don? Sua barba tá pedindo um trato."
10. Google Ads: foco em termos locais (barbearia Goiânia, barbearia Marista, barbearia Alphaville). Meta Ads: foco em lifestyle e experiência.
11. Mencionar as 2 unidades de forma equilibrada. Não favorecer uma sobre a outra.
12. Conteúdo de bastidores (behind the scenes) com cerveja, resenha e música é prioridade para stories e reels orgânicos.
13. MÍNIMO 2 publicações por mês devem citar parceiros da Don. Alternar entre os parceiros ao longo dos meses.
14. Patrocinadores: Corona e Manakai Sport & Lifestyle.
15. Ao citar parceiros, o conteúdo deve parecer natural e integrado ao universo Don — nunca como propaganda forçada.',

  ARRAY['#1A1A1A', '#D4AF37'],

  'Títulos: Montserrat Bold / Corpo: Open Sans',

  'escuro',

  'Logo Don dourado sempre no canto inferior direito. Iluminação dramática em todas as fotos. Estética cinematográfica.',

  'Nunca fundo branco. Nunca fundos pasteis. Nunca fontes script (tipo cursiva). Nunca tom de desespero ou urgência fake.',

  '[
    {"name": "Unidade Marista", "address": "Av. Mutirão, 2189, Setor Marista, Goiânia/GO"},
    {"name": "Unidade Alpha Mall", "address": "Av. Alphaville Flamboyant, loja 28, Goiânia/GO"}
  ]'::jsonb,

  '[
    {"platform": "Instagram", "url": "https://www.instagram.com/donbarbearia"},
    {"platform": "WhatsApp", "url": "https://wa.me/556200000000"}
  ]'::jsonb,

  'ativo'
);
