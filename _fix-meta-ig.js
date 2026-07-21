const fs = require('fs');

const file = 'D:/S/SUA MÍDIA/2026/AGENCIA DE BOLSO/sistema-sua-midia/n8n-workflows/publicar-meta.json';
const wf = JSON.parse(fs.readFileSync(file, 'utf8'));
const node = wf.nodes.find(n => n.name === 'Publicar no Meta');
let code = node.parameters.jsCode;

// Find and replace the igCreateAndPublish function
const fnStart = code.indexOf('function igCreateAndPublish');
if (fnStart === -1) { console.error('Not found'); process.exit(1); }

// Find the end of the function (closing brace)
let depth = 0, fnEnd = fnStart;
for (let i = fnStart; i < code.length; i++) {
  if (code[i] === '{') depth++;
  if (code[i] === '}') { depth--; if (depth === 0) { fnEnd = i + 1; break; } }
}

const oldFn = code.substring(fnStart, fnEnd);
console.log('Found function:\n', oldFn.substring(0, 100), '...');

const newFn = `async function postGet(url) {
  const resp = await fetch(url, { method: 'GET' });
  const text = await resp.text();
  return parseJson(text);
}

async function igCreateAndPublish(igId, containerParams, publishToken, GRAPH) {
  const containerResp = await postForm(` + '`${GRAPH}/${igId}/media`' + `, containerParams);
  if (containerResp.error) return { post_id: null, error: containerResp.error.message };
  if (!containerResp.id)   return { post_id: null, error: 'Instagram não retornou creation_id' };

  // Aguardar container ficar FINISHED (Instagram precisa processar a mídia)
  for (let t = 0; t < 20; t++) {
    const st = await postGet(` + '`${GRAPH}/${containerResp.id}?fields=status_code&access_token=${publishToken}`' + `);
    if (st.status_code === 'FINISHED') break;
    if (st.status_code === 'ERROR') return { post_id: null, error: 'IG media error: ' + JSON.stringify(st) };
    await new Promise(r => setTimeout(r, 2000));
  }

  const publishResp = await postForm(` + '`${GRAPH}/${igId}/media_publish`' + `, {
    creation_id:  containerResp.id,
    access_token: publishToken,
  });
  return {
    post_id: publishResp.id || null,
    error:   publishResp.error?.message || null,
  };
}`;

const newCode = code.substring(0, fnStart) + newFn + code.substring(fnEnd);
node.parameters.jsCode = newCode;
fs.writeFileSync(file, JSON.stringify(wf, null, 2), 'utf8');
console.log('✅ publicar-meta.json: igCreateAndPublish com polling + postGet helper');
