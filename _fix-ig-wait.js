/**
 * _fix-ig-wait.js
 * Adiciona polling de status do container Instagram antes de publicar
 * em publicar-agendados.json e publicar-meta.json
 */
const fs   = require('fs');
const path = require('path');
const BASE = 'D:/S/SUA MÍDIA/2026/AGENCIA DE BOLSO/sistema-sua-midia/n8n-workflows';

// ── Nova função igCreateAndPublish com polling ────────────────────────────

// Versão para publicar-agendados (usa var, httpsGet já definido no escopo)
const OLD_IG_FN_AGENDADOS = `async function igCreateAndPublish(igId, containerParams, pageToken) {
  var containerResp = await postForm(GRAPH + '/' + igId + '/media', containerParams);
  if (containerResp.error) return { post_id: null, error: containerResp.error.message };
  if (!containerResp.id)   return { post_id: null, error: 'Instagram nao retornou creation_id' };
  var publishResp = await postForm(GRAPH + '/' + igId + '/media_publish', {
    creation_id: containerResp.id, access_token: pageToken,
  });
  return {
    post_id: publishResp.id || containerResp.id,
    error: publishResp.error ? publishResp.error.message : null,
  };
}`;

const NEW_IG_FN_AGENDADOS = `async function igCreateAndPublish(igId, containerParams, pageToken) {
  var containerResp = await postForm(GRAPH + '/' + igId + '/media', containerParams);
  if (containerResp.error) return { post_id: null, error: containerResp.error.message };
  if (!containerResp.id)   return { post_id: null, error: 'Instagram nao retornou creation_id' };

  // Aguardar container ficar FINISHED (Instagram precisa processar a mídia)
  var maxTentativas = 20;
  for (var t = 0; t < maxTentativas; t++) {
    var statusResp = await httpsGet(
      GRAPH + '/' + containerResp.id + '?fields=status_code&access_token=' + pageToken,
      {}
    );
    if (statusResp.status_code === 'FINISHED') break;
    if (statusResp.status_code === 'ERROR') {
      return { post_id: null, error: 'Instagram: erro ao processar midia - ' + JSON.stringify(statusResp) };
    }
    // Aguarda 2 segundos antes de tentar novamente
    await new Promise(function(r) { setTimeout(r, 2000); });
  }

  var publishResp = await postForm(GRAPH + '/' + igId + '/media_publish', {
    creation_id: containerResp.id, access_token: pageToken,
  });
  return {
    post_id: publishResp.id || null,
    error: publishResp.error ? publishResp.error.message : null,
  };
}`;

// Versão para publicar-meta (usa const/let, fetch)
const OLD_IG_FN_META = `async function igCreateAndPublish(igId, containerParams, pageToken) {
  const container = await postForm(\`\${GRAPH}/\${igId}/media\`, containerParams)
  if (container.error) return { post_id: null, error: container.error.message }
  if (!container.id) return { post_id: null, error: 'Sem creation_id' }
  // Aguardar processamento
  for (let t = 0; t < 15; t++) {
    const st = await fetch(\`\${GRAPH}/\${container.id}?fields=status_code&access_token=\${pageToken}\`).then(r => r.json()).catch(() => ({}))
    if (st.status_code === 'FINISHED') break
    if (st.status_code === 'ERROR') return { post_id: null, error: 'IG media error: ' + JSON.stringify(st) }
    await new Promise(r => setTimeout(r, 2000))
  }
  const publish = await postForm(\`\${GRAPH}/\${igId}/media_publish\`, { creation_id: container.id, access_token: pageToken })
  return { post_id: publish.id || null, error: publish.error?.message || null }
}`;

// ── Patch publicar-agendados.json ──────────────────────────────────────────
{
  const file = path.join(BASE, 'publicar-agendados.json');
  const wf = JSON.parse(fs.readFileSync(file, 'utf8'));
  const node = wf.nodes.find(n => n.name === 'Verificar e Publicar Agendados');
  if (!node) { console.error('❌ Node não encontrado em publicar-agendados.json'); process.exit(1); }

  let code = node.parameters.jsCode;
  if (!code.includes('Instagram nao retornou creation_id')) {
    console.error('❌ Função igCreateAndPublish não encontrada em publicar-agendados.json');
    process.exit(1);
  }

  const newCode = code.replace(OLD_IG_FN_AGENDADOS, NEW_IG_FN_AGENDADOS);
  if (newCode === code) {
    console.error('❌ Substituição falhou em publicar-agendados.json');
    process.exit(1);
  }
  node.parameters.jsCode = newCode;
  fs.writeFileSync(file, JSON.stringify(wf, null, 2), 'utf8');
  console.log('✅ publicar-agendados.json: igCreateAndPublish com polling');
}

// ── Patch publicar-meta.json ───────────────────────────────────────────────
{
  const file = path.join(BASE, 'publicar-meta.json');
  const wf = JSON.parse(fs.readFileSync(file, 'utf8'));
  const node = wf.nodes.find(n => n.name === 'Publicar no Meta');
  if (!node) { console.error('❌ Node não encontrado em publicar-meta.json'); process.exit(1); }

  let code = node.parameters.jsCode;

  // Verificar se já tem polling
  if (code.includes('status_code')) {
    console.log('ℹ️  publicar-meta.json: já tem polling. OK');
  } else {
    // Adiciona após a definição de igCreateAndPublish
    // A versão do meta usa fetch, então adicionamos inline
    const oldMeta = `async function igCreateAndPublish(igId, containerParams, pageToken) {
  const container = await postForm(\`\${GRAPH}/\${igId}/media\`, containerParams);
  if (container.error) return { post_id: null, error: container.error.message };
  if (!container.id) return { post_id: null, error: 'Sem creation_id' };
  const publish = await postForm(\`\${GRAPH}/\${igId}/media_publish\`, { creation_id: container.id, access_token: pageToken });
  return { post_id: publish.id || null, error: publish.error?.message || null };
}`;

    const newMeta = `async function igCreateAndPublish(igId, containerParams, pageToken) {
  const container = await postForm(\`\${GRAPH}/\${igId}/media\`, containerParams);
  if (container.error) return { post_id: null, error: container.error.message };
  if (!container.id) return { post_id: null, error: 'Sem creation_id' };

  // Aguardar container ficar FINISHED
  for (let t = 0; t < 20; t++) {
    const st = await postFormGet(\`\${GRAPH}/\${container.id}?fields=status_code&access_token=\${pageToken}\`);
    if (st.status_code === 'FINISHED') break;
    if (st.status_code === 'ERROR') return { post_id: null, error: 'IG media error: ' + JSON.stringify(st) };
    await new Promise(r => setTimeout(r, 2000));
  }

  const publish = await postForm(\`\${GRAPH}/\${igId}/media_publish\`, { creation_id: container.id, access_token: pageToken });
  return { post_id: publish.id || null, error: publish.error?.message || null };
}`;

    if (code.includes(oldMeta)) {
      // Also add a GET helper if not present
      let newCode = code.replace(oldMeta, newMeta);

      if (!code.includes('postFormGet')) {
        const addHelper = `async function postFormGet(url) {\n  const resp = await fetch(url, { method: 'GET' });\n  const text = await resp.text();\n  return parseJson(text);\n}\n\n`;
        newCode = newCode.replace('async function igCreateAndPublish', addHelper + 'async function igCreateAndPublish');
      }

      node.parameters.jsCode = newCode;
      fs.writeFileSync(file, JSON.stringify(wf, null, 2), 'utf8');
      console.log('✅ publicar-meta.json: igCreateAndPublish com polling');
    } else {
      console.log('⚠️  publicar-meta.json: formato diferente, patch manual necessário');
    }
  }
}
