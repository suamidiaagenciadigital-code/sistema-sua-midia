/**
 * _fix-fetch.js
 * Substitui a função postForm baseada em fetch por uma baseada em require('https')
 * nos workflows publicar-meta.json e publicar-agendados.json
 */
const fs = require('fs');
const path = require('path');

// Nova implementação de postForm usando https nativo
const OLD_POST_FORM = `async function postForm(url, params) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: toFormBody(params),
  });
  const text = await resp.text();
  return parseJson(text);
}`;

const NEW_POST_FORM = `function postForm(urlStr, params) {
  const https = require('https');
  const http  = require('http');
  const { URL } = require('url');
  return new Promise((resolve, reject) => {
    const body = toFormBody(params);
    let url;
    try { url = new URL(urlStr); } catch(e) { return reject(e); }
    const options = {
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? 443 : 80),
      path:     url.pathname + url.search,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve(parseJson(data)); });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}`;

// Versão para publicar-agendados (usa var ao invés de const/let)
const OLD_POST_FORM_AGENDADOS = `async function postForm(url, params) {
  var resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: toFormBody(params),
  });
  var text = await resp.text();
  return parseJson(text);
}`;

const NEW_POST_FORM_AGENDADOS = `function postForm(urlStr, params) {
  var https = require('https');
  var http  = require('http');
  var URL   = require('url').URL;
  return new Promise(function(resolve, reject) {
    var body = toFormBody(params);
    var url;
    try { url = new URL(urlStr); } catch(e) { return reject(e); }
    var options = {
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? 443 : 80),
      path:     url.pathname + url.search,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    var lib = url.protocol === 'https:' ? https : http;
    var req = lib.request(options, function(res) {
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() { resolve(parseJson(data)); });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}`;

const files = [
  {
    file: 'publicar-meta.json',
    nodeName: 'Publicar no Meta',
    old: OLD_POST_FORM,
    replacement: NEW_POST_FORM,
  },
  {
    file: 'publicar-agendados.json',
    nodeName: 'Verificar e Publicar Agendados',
    old: OLD_POST_FORM_AGENDADOS,
    replacement: NEW_POST_FORM_AGENDADOS,
  },
];

const BASE = path.join('D:/S/SUA MÍDIA/2026/AGENCIA DE BOLSO/sistema-sua-midia/n8n-workflows');

for (const { file, nodeName, old, replacement } of files) {
  const filePath = path.join(BASE, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const wf = JSON.parse(raw);

  const node = wf.nodes.find(n => n.name === nodeName);
  if (!node) {
    console.error(`❌ Node "${nodeName}" não encontrado em ${file}`);
    continue;
  }

  const code = node.parameters.jsCode;

  if (!code.includes('fetch(url')) {
    console.log(`ℹ️  ${file}: fetch já substituído ou não encontrado. Verificando...`);
    // Try to detect if https is already there
    if (code.includes("require('https')")) {
      console.log(`✅ ${file}: já usa require('https'), nada a fazer.`);
      continue;
    }
    console.log(`⚠️  ${file}: fetch não encontrado e https não presente. Pulando.`);
    continue;
  }

  // Replace postForm
  const newCode = code.replace(old, replacement);

  if (newCode === code) {
    // Try partial match - the old string might not match exactly due to whitespace
    console.error(`❌ ${file}: substituição não encontrada (diferença de espaços?). Procurando manualmente...`);
    // Print where fetch appears
    const idx = code.indexOf('fetch(url');
    console.log('  fetch(url encontrado em índice:', idx);
    console.log('  Contexto ao redor:');
    console.log('  ---');
    console.log(code.substring(Math.max(0, idx - 200), idx + 200));
    console.log('  ---');
    continue;
  }

  node.parameters.jsCode = newCode;
  fs.writeFileSync(filePath, JSON.stringify(wf, null, 2), 'utf8');
  console.log(`✅ ${file}: postForm atualizado para require('https')`);
}
