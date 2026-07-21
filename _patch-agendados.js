/**
 * _patch-agendados.js
 * 1. Muda intervalo de 5 → 1 minuto
 * 2. Adiciona busca por status='publishing' (publicar agora imediato)
 * 3. Junta tudo num único loop de publicação
 */
const fs   = require('fs');
const path = require('path');

const FILE = path.join('D:/S/SUA MÍDIA/2026/AGENCIA DE BOLSO/sistema-sua-midia/n8n-workflows/publicar-agendados.json');
const raw  = fs.readFileSync(FILE, 'utf8');
const wf   = JSON.parse(raw);

// ── 1. Mudar intervalo do Schedule Trigger para 1 minuto ──────────────────
const trigger = wf.nodes.find(n => n.name === 'A cada 5 minutos');
if (trigger) {
  trigger.parameters.rule.interval[0].minutesInterval = 1;
  trigger.name = 'A cada 1 minuto';
  console.log('✅ Schedule: 5min → 1min');
}

// ── 2. Atualizar o Code node ───────────────────────────────────────────────
const codeNode = wf.nodes.find(n => n.name === 'Verificar e Publicar Agendados');
if (!codeNode) { console.error('❌ Code node não encontrado'); process.exit(1); }

const oldBusca = `// ── Buscar conteúdos aprovados com data <= hoje ───────────────────────────
var contentsUrl = SUPABASE_URL + '/rest/v1/contents' +
  '?select=id,client_id,type,caption,generated_image_url,media_urls,scheduled_date,scheduled_time' +
  '&status=eq.approved_by_client' +
  '&scheduled_date=lte.' + today;

var contents = await httpsGet(contentsUrl, sbHeaders);
if (!Array.isArray(contents)) contents = [];

// ── Filtrar prontos (hora chegou) ─────────────────────────────────────────
var ready = [];
for (var i = 0; i < contents.length; i++) {
  var c = contents[i];
  var cTime = c.scheduled_time || '09:00';
  if (c.scheduled_date < today || (c.scheduled_date === today && cTime <= currentTime)) {
    ready.push(c);
  }
}

if (ready.length === 0) {
  return [{ json: { published: 0, message: 'Nenhum conteudo para publicar agora (' + today + ' ' + currentTime + ')' } }];
}`;

const newBusca = `// ── Buscar conteúdos com status 'publishing' (Publicar Agora imediato) ──────
var immediateUrl = SUPABASE_URL + '/rest/v1/contents' +
  '?select=id,client_id,type,caption,generated_image_url,media_urls,scheduled_date,scheduled_time' +
  '&status=eq.publishing';

var immediateContents = await httpsGet(immediateUrl, sbHeaders);
if (!Array.isArray(immediateContents)) immediateContents = [];

// ── Buscar conteúdos aprovados com data <= hoje ───────────────────────────
var contentsUrl = SUPABASE_URL + '/rest/v1/contents' +
  '?select=id,client_id,type,caption,generated_image_url,media_urls,scheduled_date,scheduled_time' +
  '&status=eq.approved_by_client' +
  '&scheduled_date=lte.' + today;

var contents = await httpsGet(contentsUrl, sbHeaders);
if (!Array.isArray(contents)) contents = [];

// ── Filtrar agendados prontos (hora chegou) ────────────────────────────────
var scheduledReady = [];
for (var i = 0; i < contents.length; i++) {
  var c = contents[i];
  var cTime = c.scheduled_time || '09:00';
  if (c.scheduled_date < today || (c.scheduled_date === today && cTime <= currentTime)) {
    scheduledReady.push(c);
  }
}

// Imediatos primeiro, depois agendados
var ready = immediateContents.concat(scheduledReady);

if (ready.length === 0) {
  return [{ json: { published: 0, message: 'Nenhum conteudo para publicar agora (' + today + ' ' + currentTime + ')' } }];
}`;

const code = codeNode.parameters.jsCode;

if (!code.includes("status=eq.approved_by_client")) {
  console.error('❌ Trecho de busca não encontrado. Verifique o código.');
  process.exit(1);
}

let newCode = code.replace(oldBusca, newBusca);

if (newCode === code) {
  console.error('❌ Substituição falhou. Diferença de espaços ou texto.');
  process.exit(1);
}

// ── 3. Atualizar o PATCH do Supabase para incluir status 'published' sempre
// (já está assim — confirmar)
if (newCode.includes("status: 'published'")) {
  console.log('✅ Status update para published: OK');
}

codeNode.parameters.jsCode = newCode;

fs.writeFileSync(FILE, JSON.stringify(wf, null, 2), 'utf8');
console.log('✅ publicar-agendados.json atualizado com sucesso!');
