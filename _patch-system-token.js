/**
 * _patch-system-token.js
 * Substitui o page_token do cliente pelo System User Token (nunca expira,
 * não depende de aprovação do app). O page_id e ig_account_id continuam
 * vindo do Supabase por cliente.
 */
const fs   = require('fs');
const path = require('path');

const SYSTEM_TOKEN = 'EAAU7TJPfNhABRWZBZBoG8ZBcvD0Mh46CeyOjfSEXk9vMxqSZANTZB78FtzxbDgT6QjjjFFRnJFsrsKBE9oQwl53emkTELkbclUrFgKKYT8ZANEDluKhCc83Wk68QUrpYJi12jUqtZBp8DhfIsUbKY7X2n0SQJ3BLoZAojN4oP3KLy5owgRBuwMBUkcxrTzqclAZDZD';

const FILE = 'D:/S/SUA MÍDIA/2026/AGENCIA DE BOLSO/sistema-sua-midia/n8n-workflows/publicar-agendados.json';
const wf   = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const node = wf.nodes.find(n => n.name === 'Verificar e Publicar Agendados');
let code   = node.parameters.jsCode;

// Substituir a linha que define pageToken para sempre usar o System User Token
const OLD_TOKEN = `    var tokenResp = await httpsGet(\n      GRAPH + '/' + client.facebook_page_id + '?fields=access_token&access_token=' + client.facebook_page_token,\n      {}\n    );\n    var pageToken = tokenResp.access_token || client.facebook_page_token;`;

const NEW_TOKEN = `    // System User Token (não expira, não precisa de aprovação do app Meta)
    var SYSTEM_USER_TOKEN = '${SYSTEM_TOKEN}';
    var pageToken = SYSTEM_USER_TOKEN;`;

if (code.includes(OLD_TOKEN)) {
  code = code.replace(OLD_TOKEN, NEW_TOKEN);
  console.log('✅ Token substituído pelo System User Token');
} else {
  // Tentar match mais flexível
  const idx = code.indexOf("var tokenResp = await httpsGet(\n      GRAPH + '/' + client.facebook_page_id + '?fields=access_token");
  if (idx !== -1) {
    // Find end of this block
    const endIdx = code.indexOf("var pageToken =", idx) + "var pageToken = tokenResp.access_token || client.facebook_page_token;".length;
    const oldBlock = code.substring(idx, endIdx);
    console.log('Bloco encontrado:\n', oldBlock);
    code = code.substring(0, idx) + `    // System User Token (não expira, não precisa de aprovação do app Meta)\n    var SYSTEM_USER_TOKEN = '${SYSTEM_TOKEN}';\n    var pageToken = SYSTEM_USER_TOKEN;` + code.substring(endIdx);
    console.log('✅ Token substituído (método alternativo)');
  } else {
    console.error('❌ Bloco de token não encontrado. Procurando...');
    const i2 = code.indexOf('pageToken');
    console.log('pageToken encontrado em:', i2);
    console.log(code.substring(Math.max(0,i2-200), i2+100));
  }
}

node.parameters.jsCode = code;
fs.writeFileSync(FILE, JSON.stringify(wf, null, 2), 'utf8');
console.log('✅ publicar-agendados.json salvo');
