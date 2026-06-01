export type DeliverableItem = {
  icon: string
  title: string
  description: string
  qty: string
}

export type AvulsoItem = {
  name: string
  price: number
}

export type AvulsoCategory = {
  category: string
  items: AvulsoItem[]
}

export type ProposalData = {
  client_name: string
  service_title: string
  service_description: string | null
  monthly_value: number
  deliverables: DeliverableItem[]
  avulsos: AvulsoCategory[]
  whatsapp: string
  email: string
  valid_days: number
  created_at: string
}

const PROCESS_STEPS = [
  { num: '01', title: 'Briefing & Planejamento', desc: 'Reunião inicial para entender sua marca, público e objetivos. Definimos o calendário editorial do mês.' },
  { num: '02', title: 'Criação do Conteúdo', desc: 'Nossa equipe desenvolve criativos, legendas e roteiros seguindo a identidade visual da sua marca.' },
  { num: '03', title: 'Revisão & Aprovação', desc: 'Você recebe um link exclusivo para revisar e aprovar cada publicação antes de ir ao ar.' },
  { num: '04', title: 'Publicação', desc: 'Após aprovação, publicamos no horário estratégico para maximizar o alcance nas redes sociais.' },
  { num: '05', title: 'Relatório Mensal', desc: 'Enviamos relatório completo com métricas de desempenho, crescimento e insights para o próximo mês.' },
]

const FAQ_ITEMS = [
  { q: 'Qual o prazo para início dos trabalhos?', a: 'O início se dá em até 5 dias úteis após a confirmação do contrato e envio do briefing inicial.' },
  { q: 'Como funciona a aprovação de conteúdos?', a: 'Você recebe um link exclusivo com todos os posts do mês para aprovar ou solicitar ajustes, de forma simples e rápida.' },
  { q: 'Quantas revisões estão incluídas?', a: 'Cada publicação tem direito a 2 rodadas de revisão incluídas no plano.' },
  { q: 'A gestão de anúncios está incluída?', a: 'Não. A gestão de tráfego pago é um serviço avulso separado, com valores detalhados na tabela de extras.' },
  { q: 'Qual a frequência de publicações?', a: 'A frequência está definida nos entregáveis do seu plano. Trabalhamos com calendário editorial aprovado por você.' },
  { q: 'Posso cancelar o serviço?', a: 'Sim, com aviso prévio de 30 dias conforme contrato. Sem multas ou burocracia.' },
  { q: 'Como entro em contato em caso de dúvidas?', a: 'Via WhatsApp, e-mail ou reunião agendada. Nossa equipe responde em até 24h úteis.' },
]

function fmtMoney(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function validUntil(createdAt: string, days: number): string {
  const d = new Date(createdAt)
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const WA_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`

export function generateProposalHtml(data: ProposalData): string {
  const wa = data.whatsapp.replace(/\D/g, '')
  const waUrl = `https://wa.me/${wa}?text=${encodeURIComponent(`Olá! Quero fechar a proposta de ${data.service_title} para ${data.client_name}.`)}`
  const validDate = validUntil(data.created_at, data.valid_days)
  const year = new Date().getFullYear()
  const createdFmt = new Date(data.created_at).toLocaleDateString('pt-BR')

  const deliverableCards = data.deliverables.map(d => `
    <div class="card">
      <div class="card-icon">${d.icon}</div>
      <span class="card-qty">${d.qty}</span>
      <h3 class="card-title">${d.title}</h3>
      <p class="card-desc">${d.description}</p>
    </div>`).join('')

  const pricingFeatures = [
    ...data.deliverables.map(d => `${d.qty} de ${d.title}`),
    'Aprovação prévia de cada publicação',
    'Relatório mensal de resultados',
    'Suporte via WhatsApp',
  ].map(f => `<li>${f}</li>`).join('')

  const avulsosHtml = data.avulsos.length > 0 ? data.avulsos.map(cat => `
    <div class="avulso-cat">
      <div class="avulso-cat-header">${cat.category}</div>
      <table class="avulso-table">
        <tbody>${cat.items.map(item => `
          <tr><td class="av-name">${item.name}</td><td class="av-price">${fmtMoney(item.price)}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>`).join('') : ''

  const stepsHtml = PROCESS_STEPS.map(s => `
    <div class="step">
      <div class="step-num">${s.num}</div>
      <div class="step-body">
        <h3 class="step-title">${s.title}</h3>
        <p class="step-desc">${s.desc}</p>
      </div>
    </div>`).join('')

  const faqHtml = FAQ_ITEMS.map((f, i) => `
    <div class="faq-item">
      <button class="faq-btn" onclick="tog(${i})">
        <span>${f.q}</span>
        <span class="faq-chevron" id="chev-${i}">▾</span>
      </button>
      <div class="faq-ans" id="ans-${i}">${f.a}</div>
    </div>`).join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Proposta ${data.client_name} · Sua Mídia</title>
<meta name="description" content="Proposta comercial de ${data.service_title} para ${data.client_name} — Sua Mídia Agência Digital">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0b1326;--bg2:#0f1929;--card:#131b2e;--border:rgba(255,255,255,.08);--blue:#2B80FF;--purple:#A855F7;--green:#25D366;--txt:#f1f5f9;--muted:#94a3b8;--faint:#475569}
html{scroll-behavior:smooth}
body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--txt);line-height:1.6}

/* NAV */
nav{position:fixed;top:0;left:0;right:0;z-index:99;background:rgba(11,19,38,.96);backdrop-filter:blur(12px);border-bottom:1px solid var(--border)}
.nav-in{max-width:1100px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:58px}
.logo{font-size:15px;font-weight:800;background:linear-gradient(90deg,var(--blue),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.nav-links{display:flex;gap:2px}
.nav-links a{color:var(--muted);text-decoration:none;font-size:13px;font-weight:500;padding:6px 11px;border-radius:8px;transition:.15s}
.nav-links a:hover{color:var(--txt);background:rgba(255,255,255,.06)}
.nav-cta{background:linear-gradient(90deg,var(--blue),var(--purple))!important;color:#fff!important;border-radius:8px}
@media(max-width:700px){.nav-links{display:none}}

/* HERO */
.hero{padding:110px 24px 72px;text-align:center;background:radial-gradient(ellipse 80% 50% at 50% 0%,rgba(43,128,255,.13) 0%,transparent 70%)}
.badge{display:inline-block;font-size:11px;font-weight:700;color:var(--blue);background:rgba(43,128,255,.1);border:1px solid rgba(43,128,255,.3);border-radius:100px;padding:4px 14px;margin-bottom:18px;letter-spacing:.06em;text-transform:uppercase}
.hero h1{font-size:clamp(28px,5vw,54px);font-weight:800;line-height:1.15;margin-bottom:14px}
.hero h1 span{background:linear-gradient(90deg,var(--blue),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero-sub{font-size:17px;color:var(--muted);margin-bottom:28px;max-width:480px;margin-left:auto;margin-right:auto}
.valid-tag{font-size:13px;color:var(--faint);border:1px solid var(--border);border-radius:8px;padding:7px 16px;display:inline-block}

/* SECTIONS */
section{padding:76px 24px}
.s-in{max-width:1100px;margin:0 auto}
.s-label{font-size:11px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px}
.s-title{font-size:clamp(22px,3vw,34px);font-weight:700;margin-bottom:10px}
.s-desc{color:var(--muted);font-size:15px;margin-bottom:44px;max-width:580px}
.alt{background:var(--bg2)}

/* CARDS */
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:18px}
.card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:26px;transition:border-color .2s}
.card:hover{border-color:rgba(43,128,255,.35)}
.card-icon{font-size:30px;margin-bottom:10px}
.card-qty{font-size:11px;font-weight:700;color:var(--blue);background:rgba(43,128,255,.1);border-radius:6px;padding:2px 8px;display:inline-block;margin-bottom:10px}
.card-title{font-size:15px;font-weight:600;margin-bottom:6px}
.card-desc{font-size:13px;color:var(--muted);line-height:1.55}

/* PRICING */
.pricing-wrap{display:flex;justify-content:center}
.pricing-card{background:var(--card);border:1px solid rgba(43,128,255,.35);border-radius:20px;padding:38px;width:100%;max-width:480px;text-align:center;box-shadow:0 0 60px rgba(43,128,255,.07)}
.p-badge{font-size:11px;font-weight:700;color:var(--purple);background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.3);border-radius:100px;padding:4px 14px;display:inline-block;margin-bottom:18px}
.p-value{font-size:52px;font-weight:800;background:linear-gradient(90deg,var(--blue),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1;margin-bottom:4px}
.p-period{color:var(--muted);font-size:13px;margin-bottom:22px}
.p-features{list-style:none;text-align:left;margin-bottom:28px}
.p-features li{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);font-size:13px;color:var(--muted)}
.p-features li:last-child{border-bottom:none}
.p-features li::before{content:'✓';color:var(--blue);font-weight:700;flex-shrink:0}
.btn-grad{display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(90deg,var(--blue),var(--purple));color:#fff;font-weight:600;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;border:none;cursor:pointer;transition:opacity .2s;width:100%}
.btn-grad:hover{opacity:.88}

/* AVULSOS */
.avulsos-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.avulso-cat{background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden}
.avulso-cat-header{font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;padding:14px 18px;border-bottom:1px solid var(--border);background:rgba(255,255,255,.02)}
.avulso-table{width:100%;border-collapse:collapse}
.avulso-table tr:not(:last-child) td{border-bottom:1px solid var(--border)}
.av-name{padding:11px 18px;font-size:13px}
.av-price{padding:11px 18px;font-size:13px;font-weight:600;color:var(--blue);text-align:right;white-space:nowrap}

/* STEPS */
.steps{display:flex;flex-direction:column;max-width:700px}
.step{display:flex;gap:20px;position:relative}
.step:not(:last-child)::after{content:'';position:absolute;left:19px;top:42px;bottom:-4px;width:2px;background:var(--border)}
.step-num{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--purple));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;margin-top:2px}
.step-body{padding-bottom:28px;flex:1}
.step-title{font-size:15px;font-weight:600;margin-bottom:5px}
.step-desc{font-size:13px;color:var(--muted)}

/* FAQ */
.faq-list{display:flex;flex-direction:column;gap:6px;max-width:780px}
.faq-item{background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden}
.faq-btn{width:100%;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 18px;background:none;border:none;color:var(--txt);font-size:14px;font-weight:500;cursor:pointer;text-align:left}
.faq-btn:hover{background:rgba(255,255,255,.03)}
.faq-chevron{color:var(--muted);flex-shrink:0;transition:transform .2s;font-size:16px}
.faq-ans{display:none;padding:0 18px 16px;color:var(--muted);font-size:13px;line-height:1.7}
.faq-ans.open{display:block}

/* CTA */
.cta-sec{text-align:center;padding:76px 24px}
.cta-box{background:var(--card);border:1px solid rgba(43,128,255,.2);border-radius:22px;padding:56px 36px;max-width:560px;margin:0 auto;box-shadow:0 0 80px rgba(43,128,255,.06)}
.cta-box h2{font-size:clamp(22px,3vw,32px);font-weight:700;margin-bottom:10px}
.cta-box p{color:var(--muted);margin-bottom:28px;font-size:15px}
.btn-wa{display:flex;align-items:center;justify-content:center;gap:10px;background:var(--green);color:#fff;font-weight:600;font-size:15px;padding:15px 36px;border-radius:13px;text-decoration:none;transition:opacity .2s;max-width:360px;margin:0 auto 14px}
.btn-wa:hover{opacity:.9}
.cta-email{font-size:12px;color:var(--faint)}
.cta-email a{color:var(--muted);text-decoration:none}

/* FOOTER */
footer{border-top:1px solid var(--border);padding:22px 24px;text-align:center}
footer p{font-size:11px;color:var(--faint)}
</style>
</head>
<body>

<nav>
  <div class="nav-in">
    <span class="logo">Sua Mídia</span>
    <div class="nav-links">
      <a href="#entregaveis">Entregáveis</a>
      <a href="#investimento">Investimento</a>
      ${data.avulsos.length > 0 ? '<a href="#avulsos">Avulsos</a>' : ''}
      <a href="#processo">Processo</a>
      <a href="#perguntas">Perguntas</a>
      <a href="#fechar" class="nav-cta">Fechar proposta</a>
    </div>
  </div>
</nav>

<div class="hero">
  <div class="badge">Proposta Comercial</div>
  <h1>Gestão completa para<br><span>${data.client_name}</span></h1>
  <p class="hero-sub">${data.service_title}</p>
  <div class="valid-tag">⏳ Proposta válida até ${validDate}</div>
</div>

<section id="entregaveis">
  <div class="s-in">
    <div class="s-label">O que está incluído</div>
    <h2 class="s-title">Entregáveis do plano</h2>
    <p class="s-desc">${data.service_description || 'Conteúdo criado especialmente para a sua marca, com estratégia e identidade visual.'}</p>
    <div class="cards">${deliverableCards}</div>
  </div>
</section>

<section id="investimento" class="alt">
  <div class="s-in">
    <div class="s-label" style="text-align:center">Valores</div>
    <h2 class="s-title" style="text-align:center">Investimento mensal</h2>
    <p class="s-desc" style="max-width:480px;margin-left:auto;margin-right:auto;text-align:center;margin-bottom:36px">Tudo que você precisa para crescer nas redes sociais em um único plano.</p>
    <div class="pricing-wrap">
      <div class="pricing-card">
        <div class="p-badge">Plano mensal</div>
        <div class="p-value">${fmtMoney(data.monthly_value)}</div>
        <div class="p-period">por mês · renovação mensal</div>
        <ul class="p-features">${pricingFeatures}</ul>
        <a href="${waUrl}" target="_blank" class="btn-grad">${WA_ICON} Fechar via WhatsApp</a>
      </div>
    </div>
  </div>
</section>

${data.avulsos.length > 0 ? `
<section id="avulsos">
  <div class="s-in">
    <div class="s-label">Serviços adicionais</div>
    <h2 class="s-title">Avulsos & Extras</h2>
    <p class="s-desc">Potencialize seus resultados com serviços complementares sob demanda.</p>
    <div class="avulsos-grid">${avulsosHtml}</div>
  </div>
</section>` : ''}

<section id="processo" class="alt">
  <div class="s-in">
    <div class="s-label">Como trabalhamos</div>
    <h2 class="s-title">Nosso processo</h2>
    <p class="s-desc">Do briefing à publicação, cada etapa pensada para o seu sucesso.</p>
    <div class="steps">${stepsHtml}</div>
  </div>
</section>

<section id="perguntas">
  <div class="s-in">
    <div class="s-label">Dúvidas frequentes</div>
    <h2 class="s-title">Perguntas & Respostas</h2>
    <p class="s-desc">Tudo que você precisa saber antes de fechar.</p>
    <div class="faq-list">${faqHtml}</div>
  </div>
</section>

<div class="cta-sec" id="fechar">
  <div class="cta-box">
    <h2>Pronto para começar?</h2>
    <p>Entre em contato agora e vamos transformar sua presença digital.</p>
    <a href="${waUrl}" target="_blank" class="btn-wa">${WA_ICON.replace('width="18" height="18"','width="20" height="20"')} Fechar proposta no WhatsApp</a>
    <div class="cta-email">ou envie para <a href="mailto:${data.email}">${data.email}</a></div>
  </div>
</div>

<footer>
  <p>© ${year} Sua Mídia — Agência Digital &middot; Proposta gerada em ${createdFmt}</p>
</footer>

<script>
function tog(i){
  var a=document.getElementById('ans-'+i),c=document.getElementById('chev-'+i),o=a.classList.contains('open');
  document.querySelectorAll('.faq-ans').forEach(function(e){e.classList.remove('open')});
  document.querySelectorAll('.faq-chevron').forEach(function(e){e.style.transform=''});
  if(!o){a.classList.add('open');c.style.transform='rotate(180deg)'}
}
</script>
</body>
</html>`
}
