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
  { num: '01', title: 'Briefing e alinhamento', desc: 'Reunião para entender a identidade da sua marca, projetos em andamento, público-alvo e objetivos. Definimos tom de voz, referências visuais e calendário editorial.' },
  { num: '02', title: 'Planejamento do mês', desc: 'Criamos o calendário com todos os conteúdos planejados — tipo, tema, data e objetivo de cada publicação. Você aprova antes de começarmos a produzir.' },
  { num: '03', title: 'Produção e revisão', desc: 'Desenvolvemos artes, textos e edições de vídeo. Tudo passa por revisão interna antes de ir para sua aprovação. Sua marca, sem ruídos.' },
  { num: '04', title: 'Aprovação e publicação', desc: 'Você recebe os conteúdos para aprovação via WhatsApp. Após ok, publicamos nas datas e horários estratégicos para o seu público.' },
  { num: '05', title: 'Relatório e otimização', desc: 'No fechamento do mês você recebe o relatório completo de performance. Analisamos o que funcionou e ajustamos a estratégia para o próximo mês.' },
]

const FAQ_ITEMS = [
  { q: 'Publicações extras têm algum custo adicional?', a: 'Sim. O plano inclui as publicações mensais descritas nos entregáveis. Se precisar de mais conteúdo em algum mês, cada publicação extra é cobrada por unidade conforme a tabela de avulsos.' },
  { q: 'Tráfego pago está incluso no plano?', a: 'Não. Meta Ads e Google Ads são serviços avulsos, contratados separadamente quando precisar impulsionar algum conteúdo ou rodar uma campanha.' },
  { q: 'Como funciona a aprovação dos conteúdos?', a: 'Antes de qualquer publicação, você recebe o conteúdo para aprovação via WhatsApp. Nada vai para o ar sem o seu ok. O processo é ágil — geralmente aprovação em 1 a 2 dias úteis.' },
  { q: 'É possível solicitar serviços avulsos a qualquer momento?', a: 'Sim. A qualquer momento durante a parceria você pode solicitar serviços avulsos — uma campanha extra, uma arte, um sistema com IA. Basta combinar pelo WhatsApp.' },
  { q: 'Quanto tempo até a primeira publicação?', a: 'Após o contrato assinado, fazemos o briefing em até 48h. O planejamento editorial fica pronto em 3 a 5 dias úteis. A primeira publicação vai ao ar na mesma semana do início.' },
  { q: 'O contrato tem fidelidade?', a: 'Trabalhamos com contrato mensal. A intenção é construir uma parceria de longo prazo — mas sem fidelidade forçada. Se em algum momento precisar pausar, conversamos.' },
  { q: 'Como é feito o relatório mensal?', a: 'Todo mês você recebe um relatório completo com os principais indicadores: alcance, engajamento, crescimento de seguidores e performance dos conteúdos. Dados claros para orientar decisões.' },
]

const BENEFIT_ITEMS = [
  { ico: '⚡', title: 'Flexibilidade total', desc: 'Nos meses em que precisar de algo extra, basta solicitar o serviço avulso. Sem pacotes engessados.' },
  { ico: '👥', title: 'Equipe dedicada', desc: 'Redator, designer e gestor focados na sua marca. Ponto de contato direto e resposta ágil.' },
  { ico: '📊', title: 'Relatório mensal', desc: 'Alcance, engajamento e crescimento de seguidores — tudo em um relatório claro todo mês.' },
  { ico: '🛡️', title: 'Identidade preservada', desc: 'Todo conteúdo é criado dentro da sua identidade visual. Aprovação prévia antes de publicar.' },
  { ico: '💬', title: 'Atendimento direto', desc: 'Sem intermediários. Você fala com quem produz e gerencia. WhatsApp ativo e resposta rápida.' },
  { ico: '📍', title: 'Parceria local', desc: 'Presença local, reuniões no seu ritmo e comunicação sem burocracia de grandes agências.' },
]

function fmtMoney(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function validUntil(createdAt: string, days: number): string {
  const d = new Date(createdAt)
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const WA_PATH = `M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z`

function waIcon(size = 15) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="${WA_PATH}"/></svg>`
}

export function generateProposalHtml(data: ProposalData): string {
  const wa = data.whatsapp.replace(/\D/g, '')
  const waMsg = encodeURIComponent(`Olá! Quero fechar a proposta para ${data.client_name}.`)
  const waUrl = `https://wa.me/${wa}?text=${waMsg}`
  const validDate = validUntil(data.created_at, data.valid_days)
  const year = new Date().getFullYear()

  // Stats bar: total pubs, value, avulsos
  const totalPubs = data.deliverables.reduce((acc, d) => {
    const m = d.qty.match(/(\d+)/)
    return acc + (m ? parseInt(m[1]) : 0)
  }, 0)
  const statPubs = totalPubs > 0 ? String(totalPubs) : data.deliverables.length + '+'
  const hasAvulsos = data.avulsos.length > 0

  // Deliverable cards
  const delCards = data.deliverables.map((d, i) => `
      <div class="del-card rv${i > 0 ? ` d${Math.min(i, 5)}` : ''}">
        <div class="del-ico"><span style="font-size:20px;line-height:1;">${d.icon}</span></div>
        <div>
          <div class="del-num">${d.qty}</div>
          <div class="del-t">${d.title}</div>
        </div>
        <div class="del-b">${d.description}</div>
      </div>`).join('')

  // Plano list items
  const planoItems = [
    ...data.deliverables.map(d => `${d.qty} de ${d.title}`),
    'Copy + legenda estratégica em todas as publicações',
    'Aprovação prévia de todo conteúdo',
    'Relatório mensal de performance',
    ...(hasAvulsos ? ['Serviços avulsos disponíveis quando precisar'] : []),
  ].map(t => `
          <div class="plano-item"><div class="check-ico"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>${t}</div>`).join('')

  // Benefit side cards
  const benefitCards = BENEFIT_ITEMS.slice(0, 4).map(b => `
        <div class="benefit-card">
          <div class="ben-ico"><span style="font-size:16px;">${b.ico}</span></div>
          <div><div class="ben-t">${b.title}</div><div class="ben-b">${b.desc}</div></div>
        </div>`).join('')

  // Avulsos sections
  const avulsosHtml = data.avulsos.map((cat, ci) => `
    <div style="margin-top:${ci === 0 ? '56px' : '48px'};margin-bottom:12px;">
      <div class="section-tag rv" style="font-size:10px;">${cat.category}</div>
    </div>
    <div class="avulso-grid" style="margin-top:20px;${ci < data.avulsos.length - 1 ? 'margin-bottom:16px;' : ''}">
      ${cat.items.map((item, ii) => `
      <div class="avulso-card rv${ii > 0 ? ` d${Math.min(ii, 3)}` : ''}">
        <div class="av-tag">${cat.category}</div>
        <div class="av-t">${item.name}</div>
        <div class="av-price">${fmtMoney(item.price)} <small>/ unidade</small></div>
      </div>`).join('')}
    </div>`).join('')

  // Steps
  const stepsHtml = PROCESS_STEPS.map((s, i) => `
      <div class="step rv${i > 0 ? ` d${Math.min(i, 4)}` : ''}">
        <div class="step-n">${s.num}</div>
        <div><div class="step-t">${s.title}</div><div class="step-b">${s.desc}</div></div>
      </div>`).join('')

  // Benefits grid
  const benGridHtml = BENEFIT_ITEMS.map((b, i) => `
      <div class="ben-item rv${i > 0 ? ` d${Math.min(i % 3 + 1, 3)}` : ''}">
        <div class="ben-item-ico" style="font-size:22px;">${b.ico}</div>
        <div><h4>${b.title}</h4><p>${b.desc}</p></div>
      </div>`).join('')

  // FAQ
  const faqHtml = FAQ_ITEMS.map((f, i) => `
      <div class="faq-item rv${i > 0 ? ` d${Math.min(i % 3, 3)}` : ''}">
        <div class="faq-q" onclick="toggleFaq(this)">${f.q}<span class="faq-icon">+</span></div>
        <div class="faq-a">${f.a}</div>
      </div>`).join('')

  const serviceDesc = data.service_description || `Uma presença digital que reflete a excelência da ${data.client_name}. Conteúdo estratégico, consistente e que gera autoridade no mercado.`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Proposta Comercial — ${data.client_name} × Sua Mídia</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

<style>
/* ─── RESET ─── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{background:#0a0a0f;color:#f0f0f5;font-family:'Plus Jakarta Sans',sans-serif;font-weight:400;overflow-x:hidden;-webkit-font-smoothing:antialiased;line-height:1.7;}

/* ─── NOISE ─── */
body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");opacity:.025;pointer-events:none;z-index:999;}

/* ─── NAV ─── */
nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:16px 40px;display:flex;align-items:center;justify-content:space-between;background:rgba(10,10,15,0.9);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.07);transition:background .3s;}
nav img.logo{height:32px;}
.nav-links{display:flex;gap:4px;align-items:center;}
.nav-links a{color:rgba(255,255,255,0.7);text-decoration:none;padding:8px 14px;font-size:13px;font-weight:400;border-radius:9999px;transition:color .2s;white-space:nowrap;}
.nav-links a:hover{color:#fff;}
.nav-links .btn-cta{background:linear-gradient(135deg,#7b5cf6,#3b82f6);color:#fff!important;font-weight:600!important;padding:9px 18px!important;border-radius:8px;font-size:13px;}
.nav-links .btn-cta:hover{opacity:.9;}

/* ─── HAMBURGER ─── */
.ham-btn{display:none;flex-direction:column;justify-content:center;gap:5px;width:38px;height:38px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;cursor:pointer;padding:9px;flex-shrink:0;}
.ham-btn span{display:block;height:1.5px;background:#fff;border-radius:2px;transition:transform .3s,opacity .3s,width .3s;}
.ham-btn.open span:nth-child(1){transform:translateY(6.5px) rotate(45deg);}
.ham-btn.open span:nth-child(2){opacity:0;width:0;}
.ham-btn.open span:nth-child(3){transform:translateY(-6.5px) rotate(-45deg);}

/* Mobile drawer */
.mob-menu{display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:99;background:rgba(10,10,15,0.98);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);flex-direction:column;align-items:center;justify-content:center;gap:8px;opacity:0;pointer-events:none;transition:opacity .3s;}
.mob-menu.open{opacity:1;pointer-events:all;}
.mob-menu a{color:rgba(255,255,255,.75);text-decoration:none;font-family:'Outfit',sans-serif;font-size:1.3rem;font-weight:600;padding:14px 32px;border-radius:12px;transition:color .2s,background .2s;width:260px;text-align:center;}
.mob-menu a:hover{color:#fff;background:rgba(255,255,255,.05);}
.mob-menu .mob-cta{background:linear-gradient(135deg,#7b5cf6,#3b82f6);color:#fff!important;margin-top:8px;font-size:1rem;}

@media(max-width:768px){
  .nav-links{display:none;}
  .ham-btn{display:flex;}
  nav{padding:14px 20px;}
  .mob-menu{display:flex;}
  #hero{padding:100px 20px 60px;min-height:100svh;}
  .hero-badge{font-size:11px;padding:5px 12px;text-align:center;}
  .hero h1{font-size:clamp(2rem,8vw,3rem);letter-spacing:-.02em;}
  .hero-sub{font-size:15px;max-width:100%;}
  .hero-ctas{flex-direction:column;align-items:stretch;gap:12px;}
  .btn-primary,.btn-secondary{justify-content:center;padding:14px 20px;font-size:15px;}
  .hero-validity{font-size:11px;padding:8px 16px;line-height:1.4;}
  .stats-bar{padding:8px 24px;display:flex;flex-direction:column;gap:0;overflow:visible;}
  .stat{flex:none;width:100%;padding:14px 0;text-align:left;display:flex;align-items:center;gap:16px;border-bottom:1px solid rgba(255,255,255,.06);}
  .stat:last-child{border-bottom:none;}
  .stat+.stat::before{display:none;}
  .stat-n{font-size:1.5rem;min-width:80px;flex-shrink:0;}
  .stat-l{font-size:12px;}
  section{padding:72px 20px;}
  #contexto{padding:60px 20px;}
  .context-card{padding:28px 24px;}
  .context-h{font-size:1.3rem;}
  .context-p{font-size:14px;}
  .del-grid{grid-template-columns:1fr;margin-top:40px;}
  #plano{padding:72px 20px;}
  .plano-wrap{grid-template-columns:1fr;margin-top:40px;}
  .plano-card{padding:28px 24px;}
  .plano-price{font-size:3rem;}
  .avulso-grid{grid-template-columns:1fr;margin-top:32px;}
  .steps::before{left:22px;}
  .step{padding:20px 18px;gap:16px;}
  .step-n{width:44px;height:44px;font-size:.85rem;border-radius:12px;flex-shrink:0;}
  .ben-grid{grid-template-columns:1fr;}
  .testi-grid{grid-template-columns:1fr;}
  #cta{padding:80px 20px;}
  .cta-cards{grid-template-columns:1fr;margin:32px auto;}
  .faq-list{margin-top:40px;}
  .faq-q{font-size:13px;padding:16px 18px;}
  .faq-a{padding:0 18px;}
  .faq-item.open .faq-a{padding:0 18px 16px;}
  footer{padding:36px 20px 28px;}
  .footer-links{gap:16px;flex-wrap:wrap;justify-content:center;}
  .section-title{font-size:clamp(1.6rem,6vw,2.2rem);}
}

/* ─── HERO ─── */
#hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:120px 24px 80px;position:relative;overflow:hidden;background:#000;}
.hero-glow{position:absolute;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgba(123,92,246,.18) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;animation:pulse 6s ease-in-out infinite;}
.hero-glow2{position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(59,130,246,.12) 0%,transparent 70%);top:30%;left:20%;pointer-events:none;animation:pulse 8s ease-in-out 2s infinite;}
@keyframes pulse{0%,100%{opacity:.6;transform:translate(-50%,-50%) scale(1);}50%{opacity:1;transform:translate(-50%,-50%) scale(1.1);}}
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(123,92,246,.12);border:1px solid rgba(123,92,246,.3);color:#c4b5fd;padding:6px 16px;border-radius:9999px;font-size:13px;font-weight:500;letter-spacing:.03em;margin-bottom:28px;}
.badge-dot{width:6px;height:6px;background:#c4b5fd;border-radius:50%;animation:blink 2s infinite;}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:.3;}}
.hero h1{font-family:'Outfit',sans-serif;font-size:clamp(2.4rem,6vw,4.8rem);font-weight:800;line-height:1.08;letter-spacing:-.03em;margin-bottom:20px;max-width:860px;}
.hero h1 span{background:linear-gradient(135deg,#a78bfa,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.hero-sub{font-size:clamp(15px,1.8vw,17px);font-weight:300;color:rgba(255,255,255,.72);max-width:560px;margin-bottom:36px;line-height:1.65;}
.hero-ctas{display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-bottom:60px;}
.hero-validity{font-size:12px;font-weight:400;color:rgba(255,255,255,.3);letter-spacing:.06em;border:1px solid rgba(255,255,255,.1);border-radius:9999px;padding:6px 18px;text-transform:uppercase;}

/* ─── STATS BAR ─── */
.stats-bar{background:rgba(255,255,255,.02);border-top:1px solid rgba(255,255,255,.07);border-bottom:1px solid rgba(255,255,255,.07);padding:28px 40px;display:flex;gap:0;overflow-x:auto;}
.stat{flex:1;min-width:140px;text-align:center;padding:0 24px;position:relative;}
.stat+.stat::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:1px;height:40px;background:rgba(255,255,255,.07);}
.stat-n{font-family:'Outfit',sans-serif;font-size:1.8rem;font-weight:800;background:linear-gradient(135deg,#a78bfa,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.stat-l{font-size:12px;color:rgba(255,255,255,.45);margin-top:2px;}

/* ─── SECTIONS ─── */
section{padding:100px 24px;}
.container{max-width:1100px;margin:0 auto;}
.section-tag{display:inline-block;font-size:11px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:#c4b5fd;margin-bottom:12px;}
.section-title{font-family:'Outfit',sans-serif;font-size:clamp(1.8rem,4vw,3rem);font-weight:800;line-height:1.12;margin-bottom:16px;letter-spacing:-.02em;}
.section-sub{font-size:1rem;color:rgba(255,255,255,.55);max-width:560px;font-weight:300;line-height:1.7;}

/* ─── BUTTONS ─── */
.btn-primary{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#7b5cf6,#3b82f6);color:#fff;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none;transition:transform .2s,box-shadow .2s;font-family:'Plus Jakarta Sans',sans-serif;box-shadow:0 0 40px rgba(123,92,246,.3);}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 0 60px rgba(123,92,246,.5);}
.btn-secondary{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.75);padding:14px 22px;border-radius:10px;font-size:15px;font-weight:400;text-decoration:none;transition:border-color .2s,color .2s;font-family:'Plus Jakarta Sans',sans-serif;}
.btn-secondary:hover{border-color:rgba(123,92,246,.5);color:#fff;}

/* ─── CONTEXT STRIP ─── */
#contexto{background:#000;padding:80px 24px;}
.context-card{max-width:860px;margin:0 auto;background:linear-gradient(135deg,rgba(123,92,246,.08),rgba(59,130,246,.06));border:1px solid rgba(123,92,246,.2);border-radius:20px;padding:48px 48px;position:relative;overflow:hidden;}
.context-card::before{content:'';position:absolute;top:-80px;right:-80px;width:260px;height:260px;background:radial-gradient(circle,rgba(123,92,246,.15),transparent 70%);border-radius:50%;}
.context-q{font-size:10px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.3);margin-bottom:16px;}
.context-h{font-family:'Outfit',sans-serif;font-size:clamp(1.4rem,3vw,2rem);font-weight:700;line-height:1.25;margin-bottom:20px;letter-spacing:-.02em;}
.context-h span{background:linear-gradient(135deg,#a78bfa,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.context-p{font-size:15px;font-weight:300;color:rgba(255,255,255,.6);line-height:1.75;max-width:620px;}

/* ─── ENTREGÁVEIS ─── */
#entregaveis{background:#0a0a0f;}
.del-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:60px;}
.del-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:28px;display:flex;flex-direction:column;gap:14px;transition:border-color .3s,transform .3s;}
.del-card:hover{border-color:rgba(123,92,246,.3);transform:translateY(-4px);}
.del-ico{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,rgba(123,92,246,.15),rgba(59,130,246,.15));border:1px solid rgba(123,92,246,.2);display:flex;align-items:center;justify-content:center;}
.del-num{font-family:'Outfit',sans-serif;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(123,92,246,.7);margin-bottom:2px;}
.del-t{font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;color:#fff;}
.del-b{font-size:13px;font-weight:300;color:rgba(255,255,255,.5);line-height:1.65;flex:1;}
@media(max-width:900px){.del-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:500px){.del-grid{grid-template-columns:1fr;}}

/* ─── PLANO ─── */
#plano{background:#000;padding:100px 24px;}
.plano-wrap{display:grid;grid-template-columns:1.1fr 1fr;gap:28px;align-items:start;margin-top:60px;}
.plano-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);border-radius:24px;padding:40px;}
.plano-tag{font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.3);margin-bottom:10px;}
.plano-price{font-family:'Outfit',sans-serif;font-size:clamp(3rem,6vw,4.2rem);font-weight:800;line-height:1;letter-spacing:-.03em;color:#fff;margin-bottom:4px;}
.plano-price sup{font-size:1.2rem;font-weight:500;vertical-align:top;margin-top:10px;display:inline-block;}
.plano-period{font-size:13px;font-weight:300;color:rgba(255,255,255,.35);margin-bottom:32px;}
.plano-list{display:flex;flex-direction:column;gap:11px;margin-bottom:28px;}
.plano-item{display:flex;align-items:flex-start;gap:10px;font-size:14px;font-weight:400;color:rgba(255,255,255,.78);line-height:1.5;}
.check-ico{width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,rgba(123,92,246,.4),rgba(59,130,246,.4));flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;}
.check-ico svg{width:10px;height:10px;stroke:#fff;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;}
hr.divider{border:none;border-top:1px solid rgba(255,255,255,.06);margin:24px 0;}
.plano-obs{font-size:12px;font-weight:300;color:rgba(255,255,255,.3);line-height:1.6;margin-bottom:24px;}
.plano-side{display:flex;flex-direction:column;gap:14px;}
.benefit-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:20px 22px;display:flex;gap:14px;align-items:flex-start;transition:border-color .3s;}
.benefit-card:hover{border-color:rgba(123,92,246,.25);}
.ben-ico{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,rgba(123,92,246,.15),rgba(59,130,246,.15));border:1px solid rgba(123,92,246,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.ben-t{font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;color:#fff;margin-bottom:3px;}
.ben-b{font-size:12px;font-weight:300;color:rgba(255,255,255,.4);line-height:1.6;}
@media(max-width:860px){.plano-wrap{grid-template-columns:1fr;}}

/* ─── AVULSOS ─── */
#avulsos{background:#0a0a0f;}
.avulso-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:60px;}
.avulso-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:26px;display:flex;flex-direction:column;gap:10px;transition:border-color .3s,transform .3s;}
.avulso-card:hover{border-color:rgba(123,92,246,.3);transform:translateY(-3px);}
.av-tag{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.28);}
.av-t{font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;color:#fff;line-height:1.3;}
.av-b{font-size:12px;font-weight:300;color:rgba(255,255,255,.45);line-height:1.65;flex:1;}
.av-price{font-family:'Outfit',sans-serif;font-size:1.4rem;font-weight:700;color:#fff;margin-top:6px;}
.av-price small{font-family:'Plus Jakarta Sans',sans-serif;font-size:11px;font-weight:300;color:rgba(255,255,255,.3);}
@media(max-width:900px){.avulso-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:500px){.avulso-grid{grid-template-columns:1fr;}}

/* ─── PROCESSO ─── */
#processo{background:#000;}
.steps{display:flex;flex-direction:column;gap:12px;max-width:700px;margin:60px auto 0;position:relative;}
.steps::before{content:'';position:absolute;left:27px;top:38px;bottom:38px;width:1px;background:linear-gradient(to bottom,rgba(123,92,246,.5),rgba(59,130,246,.3),transparent);}
.step{display:flex;gap:22px;align-items:flex-start;padding:26px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);border-radius:16px;position:relative;z-index:1;transition:border-color .3s;}
.step:hover{border-color:rgba(123,92,246,.25);}
.step-n{width:54px;height:54px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:14px;background:linear-gradient(135deg,#7b5cf6,#3b82f6);font-family:'Outfit',sans-serif;font-size:1rem;font-weight:800;color:#fff;}
.step-t{font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;color:#fff;margin-bottom:5px;}
.step-b{font-size:13px;font-weight:300;color:rgba(255,255,255,.5);line-height:1.65;}

/* ─── BENEFÍCIOS ─── */
#porque{background:#0a0a0f;}
.ben-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:60px;}
.ben-item{display:flex;gap:16px;padding:22px 24px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);border-radius:14px;transition:border-color .3s,background .3s;}
.ben-item:hover{border-color:rgba(123,92,246,.25);background:rgba(123,92,246,.04);}
.ben-item-ico{font-size:22px;flex-shrink:0;margin-top:2px;}
.ben-item h4{font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;color:#fff;margin-bottom:4px;}
.ben-item p{font-size:13px;font-weight:300;color:rgba(255,255,255,.5);line-height:1.65;}
@media(max-width:600px){.ben-grid{grid-template-columns:1fr;}}

/* ─── CTA ─── */
#cta{background:linear-gradient(180deg,#000 0%,#0a0a0f 100%);text-align:center;padding:120px 24px;}
.cta-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:820px;margin:48px auto;text-align:left;}
.cta-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:24px;}
.cta-card-ico{margin-bottom:12px;font-size:22px;}
.cta-card h4{font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;color:#c4b5fd;text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px;}
.cta-card p{font-size:12px;font-weight:300;color:rgba(255,255,255,.45);line-height:1.6;}
@media(max-width:700px){.cta-cards{grid-template-columns:1fr;}}

/* ─── FAQ ─── */
#faq{background:#0a0a0f;}
.faq-list{max-width:720px;margin:56px auto 0;display:flex;flex-direction:column;gap:10px;}
.faq-item{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);border-radius:14px;overflow:hidden;}
.faq-q{padding:18px 22px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;color:#fff;user-select:none;transition:color .2s;}
.faq-q:hover{color:#c4b5fd;}
.faq-icon{width:24px;height:24px;border-radius:50%;border:1px solid rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;transition:transform .3s,border-color .3s;}
.faq-item.open .faq-icon{transform:rotate(45deg);border-color:rgba(123,92,246,.5);}
.faq-a{max-height:0;overflow:hidden;transition:max-height .35s ease,padding .3s;font-size:13px;color:rgba(255,255,255,.5);padding:0 22px;line-height:1.7;}
.faq-item.open .faq-a{max-height:200px;padding:0 22px 18px;}

/* ─── FOOTER ─── */
footer{background:rgba(255,255,255,.02);border-top:1px solid rgba(255,255,255,.07);padding:48px 40px 32px;text-align:center;}
footer img{height:30px;margin-bottom:20px;opacity:.7;}
.footer-links{display:flex;gap:28px;justify-content:center;margin-bottom:22px;flex-wrap:wrap;}
.footer-links a{color:rgba(255,255,255,.4);text-decoration:none;font-size:13px;transition:color .2s;}
.footer-links a:hover{color:rgba(255,255,255,.75);}
footer p{font-size:12px;color:rgba(255,255,255,.25);}

/* ─── REVEAL ─── */
.rv{opacity:0;transform:translateY(28px);transition:opacity .7s ease,transform .7s ease;}
.rv.on{opacity:1;transform:translateY(0);}
.fi{opacity:0;transform:translateY(16px);filter:blur(6px);transition:opacity .6s ease,transform .6s ease,filter .6s ease;}
.fi.on{opacity:1;transform:translateY(0);filter:blur(0);}
.d1{transition-delay:.1s;}.d2{transition-delay:.2s;}.d3{transition-delay:.3s;}.d4{transition-delay:.4s;}.d5{transition-delay:.5s;}
</style>
</head>
<body>

<!-- NAV -->
<nav id="nav">
  <a href="#">
    <img class="logo" src="https://sistema.suamidia.com.br/logo.png" alt="Sua Mídia" onerror="this.style.display='none';this.nextSibling.style.display='block'">
    <span style="display:none;font-family:'Outfit',sans-serif;font-weight:800;font-size:16px;background:linear-gradient(135deg,#a78bfa,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Sua Mídia</span>
  </a>
  <div class="nav-links">
    <a href="#entregaveis">Entregáveis</a>
    <a href="#plano">Investimento</a>
    ${hasAvulsos ? '<a href="#avulsos">Avulsos</a>' : ''}
    <a href="#processo">Processo</a>
    <a href="#faq">Perguntas</a>
    <a href="${waUrl}" class="btn-cta">Fechar proposta</a>
  </div>
  <button class="ham-btn" id="hamBtn" onclick="toggleMenu()" aria-label="Menu">
    <span></span><span></span><span></span>
  </button>
</nav>

<!-- Mobile menu -->
<div class="mob-menu" id="mobMenu">
  <a href="#entregaveis" onclick="closeMenu()">Entregáveis</a>
  <a href="#plano" onclick="closeMenu()">Investimento</a>
  ${hasAvulsos ? '<a href="#avulsos" onclick="closeMenu()">Avulsos</a>' : ''}
  <a href="#processo" onclick="closeMenu()">Processo</a>
  <a href="#faq" onclick="closeMenu()">Perguntas</a>
  <a href="${waUrl}" class="mob-cta" onclick="closeMenu()">Fechar proposta</a>
</div>


<!-- HERO -->
<section id="hero">
  <div class="hero-glow"></div>
  <div class="hero-glow2"></div>

  <div class="hero-badge fi" id="hbadge">
    <span class="badge-dot"></span>
    Proposta Exclusiva · ${data.client_name} × Sua Mídia · ${year}
  </div>

  <h1 id="hh" class="fi" style="transition-delay:.15s;">
    ${data.service_title}<br>para a <span>${data.client_name}.</span>
  </h1>

  <p class="hero-sub fi" id="hs" style="transition-delay:.3s;">
    ${serviceDesc}
  </p>

  <div class="hero-ctas fi" id="hctas" style="transition-delay:.45s;">
    <a href="#plano" class="btn-primary">
      Ver o plano completo
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
    </a>
    <a href="${waUrl}" class="btn-secondary">
      ${waIcon(14)}
      Falar no WhatsApp
    </a>
  </div>

  <div class="hero-validity fi" id="hvalid" style="transition-delay:.6s;">
    Proposta válida por ${data.valid_days} dias · Exclusiva para ${data.client_name}
  </div>
</section>

<!-- Stats bar -->
<div class="stats-bar">
  <div class="stat"><div class="stat-n">${statPubs}</div><div class="stat-l">Publicações por mês</div></div>
  <div class="stat"><div class="stat-n">${data.deliverables.length}</div><div class="stat-l">Formatos de conteúdo</div></div>
  <div class="stat"><div class="stat-n">${fmtMoney(data.monthly_value)}</div><div class="stat-l">Investimento mensal</div></div>
  <div class="stat"><div class="stat-n">${hasAvulsos ? '+Avulsos' : '✓ Full'}</div><div class="stat-l">${hasAvulsos ? 'Flexibilidade quando precisar' : 'Tudo incluído no plano'}</div></div>
</div>


<!-- CONTEXTO -->
<section id="contexto">
  <div class="container">
    <div class="context-card rv">
      <div class="context-q">Por que agora</div>
      <h2 class="context-h">Quem não aparece nas redes<br><span>perde espaço para quem aparece.</span></h2>
      <p class="context-p">${serviceDesc} Redes sociais bem gerenciadas constroem autoridade, geram indicações e abrem portas que o concorrente que publica todo dia já está aproveitando. Este é o momento de a ${data.client_name} assumir esse espaço.</p>
    </div>
  </div>
</section>


<!-- ENTREGÁVEIS -->
<section id="entregaveis">
  <div class="container">
    <div style="text-align:center;margin-bottom:0;">
      <div class="section-tag rv">O que você recebe</div>
      <h2 class="section-title rv d1">${statPubs} publicações por mês.<br>Cada uma com um propósito.</h2>
      <p class="section-sub rv d2" style="margin:0 auto;">${data.deliverables.length} formatos de conteúdo planejados para construir autoridade, engajamento e novos negócios para a ${data.client_name}.</p>
    </div>
    <div class="del-grid">
      ${delCards}
    </div>
  </div>
</section>


<!-- PLANO -->
<section id="plano">
  <div class="container">
    <div style="text-align:center;">
      <div class="section-tag rv">Investimento</div>
      <h2 class="section-title rv d1">Gestão completa.<br>Valor justo.</h2>
    </div>

    <div class="plano-wrap">
      <div class="plano-card rv">
        <div class="plano-tag">Plano Mensal — ${data.service_title}</div>
        <div class="plano-price"><sup>R$</sup> ${Math.floor(data.monthly_value).toLocaleString('pt-BR')}</div>
        <div class="plano-period">por mês · contrato mensal</div>

        <div class="plano-list">
          ${planoItems}
        </div>

        <hr class="divider">
        <p class="plano-obs">* Tráfego pago (Meta Ads e Google Ads), publicações extras e demais serviços${hasAvulsos ? ' estão na tabela de avulsos, contratados' : ' são contratados'} separadamente conforme a necessidade.</p>

        <a href="${waUrl}" class="btn-primary" style="align-self:flex-start;">
          ${waIcon(15)}
          Fechar proposta agora
        </a>
      </div>

      <div class="plano-side rv d1">
        ${benefitCards}
      </div>
    </div>
  </div>
</section>


${hasAvulsos ? `<!-- AVULSOS -->
<section id="avulsos">
  <div class="container">
    <div style="text-align:center;">
      <div class="section-tag rv">Serviços avulsos</div>
      <h2 class="section-title rv d1">Quando precisar de algo a mais,<br>é só pedir.</h2>
      <p class="section-sub rv d2" style="margin:0 auto;">Nenhum avulso é obrigatório. Quando a ${data.client_name} precisar, está disponível com agilidade — sem precisar contratar outra agência.</p>
    </div>
    ${avulsosHtml}
  </div>
</section>` : ''}


<!-- PROCESSO -->
<section id="processo" style="background:#000;">
  <div class="container">
    <div style="text-align:center;">
      <div class="section-tag rv">Como funciona</div>
      <h2 class="section-title rv d1">Do contrato à primeira<br>publicação em dias.</h2>
      <p class="section-sub rv d2" style="margin:0 auto;">Você não precisa entender de tecnologia ou de redes sociais. A gente cuida de tudo.</p>
    </div>
    <div class="steps">
      ${stepsHtml}
    </div>
  </div>
</section>


<!-- BENEFÍCIOS -->
<section id="porque">
  <div class="container">
    <div style="text-align:center;">
      <div class="section-tag rv">Por que vale a pena</div>
      <h2 class="section-title rv d1">Não é sobre aparecer.<br>É sobre ser lembrado.</h2>
    </div>
    <div class="ben-grid">
      ${benGridHtml}
    </div>
  </div>
</section>


<!-- CTA -->
<section id="cta">
  <div class="container" style="position:relative;text-align:center;">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(123,92,246,.1) 0%,transparent 65%);pointer-events:none;"></div>
    <div class="section-tag rv" style="display:block;">Próximo passo</div>
    <h2 class="section-title rv d1">A ${data.client_name} pronta para<br><span style="background:linear-gradient(135deg,#a78bfa,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">dominar as redes.</span></h2>
    <p class="section-sub rv d2" style="margin:0 auto 0;">Proposta válida por ${data.valid_days} dias. Envie uma mensagem agora e a gente agenda o início ainda essa semana.</p>

    <div class="cta-cards rv d2">
      <div class="cta-card">
        <div class="cta-card-ico">🎯</div>
        <h4>Diagnóstico gratuito</h4>
        <p>Sem custo. Entendemos a ${data.client_name} antes de qualquer proposta de serviço.</p>
      </div>
      <div class="cta-card">
        <div class="cta-card-ico">⚡</div>
        <h4>Início rápido</h4>
        <p>Após fechar, primeira reunião de briefing em até 48h. Publicações no ar na mesma semana.</p>
      </div>
      <div class="cta-card">
        <div class="cta-card-ico">💬</div>
        <h4>Sem tecnichês</h4>
        <p>Explicamos tudo de forma simples. Você aprova, a gente executa.</p>
      </div>
    </div>

    <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;" class="rv d3">
      <a href="${waUrl}" class="btn-primary" style="font-size:16px;padding:16px 32px;">
        ${waIcon(17)}
        Fechar proposta no WhatsApp
      </a>
      <a href="mailto:${data.email}" class="btn-secondary" style="font-size:16px;padding:16px 24px;">
        Enviar por e-mail
      </a>
    </div>
  </div>
</section>


<!-- FAQ -->
<section id="faq" style="background:#000;">
  <div class="container">
    <div style="text-align:center;">
      <div class="section-tag rv">Tire suas dúvidas</div>
      <h2 class="section-title rv d1">Perguntas frequentes</h2>
    </div>
    <div class="faq-list">
      ${faqHtml}
    </div>
  </div>
</section>


<!-- FOOTER -->
<footer>
  <img src="https://sistema.suamidia.com.br/logo.png" alt="Sua Mídia" onerror="this.style.display='none'">
  <div class="footer-links">
    <a href="#entregaveis">Entregáveis</a>
    <a href="#plano">Investimento</a>
    ${hasAvulsos ? '<a href="#avulsos">Avulsos</a>' : ''}
    <a href="#processo">Processo</a>
    <a href="#faq">Perguntas</a>
    <a href="${waUrl}">WhatsApp</a>
  </div>
  <p>© ${year} Sua Mídia Agência Digital · Proposta exclusiva para ${data.client_name} · Válida até ${validDate}</p>
</footer>


<script>
// ── HAMBURGER ──
function toggleMenu(){
  var btn=document.getElementById('hamBtn');
  var menu=document.getElementById('mobMenu');
  btn.classList.toggle('open');
  menu.classList.toggle('open');
  document.body.style.overflow=menu.classList.contains('open')?'hidden':'';
}
function closeMenu(){
  document.getElementById('hamBtn').classList.remove('open');
  document.getElementById('mobMenu').classList.remove('open');
  document.body.style.overflow='';
}

// ── REVEAL ──
var io = new IntersectionObserver(function(entries){
  entries.forEach(function(e){
    if(!e.isIntersecting) return;
    e.target.classList.add('on');
    io.unobserve(e.target);
  });
},{threshold:0.12});
document.querySelectorAll('.rv,.fi').forEach(function(el){io.observe(el);});

// Hero fires on load
setTimeout(function(){
  ['hbadge','hh','hs','hctas','hvalid'].forEach(function(id){
    var el=document.getElementById(id);
    if(el) el.classList.add('on');
  });
},300);

// ── FAQ ──
function toggleFaq(btn){
  var item=btn.parentElement;
  var isOpen=item.dataset.open==='1';
  document.querySelectorAll('.faq-item').forEach(function(i){
    i.dataset.open='0';
    i.querySelector('.faq-a').style.maxHeight='0';
    i.querySelector('.faq-a').style.paddingBottom='0';
    i.querySelector('.faq-icon').style.transform='rotate(0deg)';
    i.querySelector('.faq-icon').style.borderColor='rgba(255,255,255,0.15)';
  });
  if(!isOpen){
    item.dataset.open='1';
    item.querySelector('.faq-a').style.maxHeight='200px';
    item.querySelector('.faq-a').style.paddingBottom='18px';
    item.querySelector('.faq-icon').style.transform='rotate(45deg)';
    item.querySelector('.faq-icon').style.borderColor='rgba(123,92,246,0.5)';
  }
}

// ── NAV ──
window.addEventListener('scroll',function(){
  document.getElementById('nav').style.background=
    window.scrollY>40?'rgba(10,10,15,0.97)':'rgba(10,10,15,0.85)';
},{passive:true});

// ── SMOOTH SCROLL ──
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    var t=document.querySelector(a.getAttribute('href'));
    if(t){e.preventDefault();closeMenu();setTimeout(function(){t.scrollIntoView({behavior:'smooth'});},10);}
  });
});
</script>
</body>
</html>`
}
