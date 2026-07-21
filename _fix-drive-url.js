/**
 * _fix-drive-url.js
 * Troca drive.google.com/uc?export=download por drive.usercontent.google.com/download
 * que é o novo domínio de download direto do Google Drive, sem redirecionamentos.
 */
const fs   = require('fs');
const path = require('path');

const OLD_VIDEO_URL = `'https://drive.google.com/uc?export=download&id=' + match[1]`;
const NEW_VIDEO_URL = `'https://drive.usercontent.google.com/download?id=' + match[1] + '&export=download&confirm=t'`;

const files = [
  { file: 'publicar-agendados.json', node: 'Verificar e Publicar Agendados' },
  { file: 'publicar-meta.json',      node: 'Publicar no Meta' },
];

const BASE = 'D:/S/SUA MÍDIA/2026/AGENCIA DE BOLSO/sistema-sua-midia/n8n-workflows';

for (const { file, node: nodeName } of files) {
  const filePath = path.join(BASE, file);
  const wf   = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const node = wf.nodes.find(n => n.name === nodeName);
  if (!node) { console.error('❌ Node não encontrado:', nodeName); continue; }

  const code    = node.parameters.jsCode;
  const newCode = code.replace(OLD_VIDEO_URL, NEW_VIDEO_URL);

  if (newCode === code) {
    console.log(`⚠️  ${file}: URL não encontrada para substituir`);
    continue;
  }

  node.parameters.jsCode = newCode;
  fs.writeFileSync(filePath, JSON.stringify(wf, null, 2), 'utf8');
  console.log(`✅ ${file}: resolveVideoUrl atualizado`);
}
