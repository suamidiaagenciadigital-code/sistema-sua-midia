/**
 * _fix-story-video.js
 *
 * Problema: isVideoUrl() checa extensão do arquivo (.mp4, .mov...)
 * URLs do Google Drive não têm extensão, então stories com vídeo
 * eram publicados como imagem (thumbnail).
 *
 * Fix: adicionar isDriveUrl() e tratar Drive URLs em stories como vídeo.
 * Isso usa resolveVideoUrl() → drive.google.com/uc?export=download&id=ID
 * que faz download direto do arquivo (funciona para vídeos ≤25MB).
 */
const fs   = require('fs');
const path = require('path');
const BASE = 'D:/S/SUA MÍDIA/2026/AGENCIA DE BOLSO/sistema-sua-midia/n8n-workflows';

// ── patch publicar-agendados.json ──────────────────────────────────────────
{
  const file = path.join(BASE, 'publicar-agendados.json');
  const wf   = JSON.parse(fs.readFileSync(file, 'utf8'));
  const node = wf.nodes.find(n => n.name === 'Verificar e Publicar Agendados');

  let code = node.parameters.jsCode;

  // 1. Adicionar isDriveUrl após isVideoUrl
  const OLD_IS_VIDEO = `// ── Detectar se URL é de vídeo (por extensão) ────────────────────────────
function isVideoUrl(url) {
  if (!url) return false;
  return /\\.(mp4|mov|avi|webm|m4v)/i.test(url);
}`;

  const NEW_IS_VIDEO = `// ── Detectar se URL é de vídeo (por extensão) ────────────────────────────
function isVideoUrl(url) {
  if (!url) return false;
  return /\\.(mp4|mov|avi|webm|m4v)/i.test(url);
}

// ── Detectar se é URL do Google Drive (sem extensão visível) ──────────────
function isDriveUrl(url) {
  if (!url) return false;
  return /drive\\.google\\.com/.test(url);
}`;

  if (!code.includes('isDriveUrl')) {
    code = code.replace(OLD_IS_VIDEO, NEW_IS_VIDEO);
    console.log('✅ isDriveUrl adicionado');
  } else {
    console.log('ℹ️  isDriveUrl já existe');
  }

  // 2. Corrigir story Facebook: Drive URL → trata como vídeo
  const OLD_FB_STORY = `for (var sf = 0; sf < storyUrlsFb.length; sf++) {
          var isVidFb    = isVideoUrl(storyUrlsFb[sf]);
          var frameUrlFb = isVidFb ? resolveVideoUrl(storyUrlsFb[sf]) : resolveUrl(storyUrlsFb[sf]);
          var fbStoryParams = { access_token: pageToken };
          if (isVidFb) { fbStoryParams.file_url = frameUrlFb; } else { fbStoryParams.url = frameUrlFb; }
          fbResp = await postForm(
            GRAPH + '/' + client.facebook_page_id + (isVidFb ? '/video_stories' : '/photo_stories'),
            fbStoryParams
          );`;

  const NEW_FB_STORY = `for (var sf = 0; sf < storyUrlsFb.length; sf++) {
          // Drive URLs sem extensão são tratadas como vídeo (a maioria dos stories é vídeo)
          var isVidFb    = isVideoUrl(storyUrlsFb[sf]) || isDriveUrl(storyUrlsFb[sf]);
          var frameUrlFb = isVidFb ? resolveVideoUrl(storyUrlsFb[sf]) : resolveUrl(storyUrlsFb[sf]);
          var fbStoryParams = { access_token: pageToken };
          if (isVidFb) { fbStoryParams.file_url = frameUrlFb; } else { fbStoryParams.url = frameUrlFb; }
          fbResp = await postForm(
            GRAPH + '/' + client.facebook_page_id + (isVidFb ? '/video_stories' : '/photo_stories'),
            fbStoryParams
          );`;

  if (code.includes(OLD_FB_STORY)) {
    code = code.replace(OLD_FB_STORY, NEW_FB_STORY);
    console.log('✅ Story Facebook: Drive URL → vídeo');
  } else {
    console.log('❌ Story Facebook: trecho não encontrado');
  }

  // 3. Corrigir story Instagram: Drive URL → trata como vídeo
  const OLD_IG_STORY = `for (var si = 0; si < storyUrlsIg.length; si++) {
            var isVidIg    = isVideoUrl(storyUrlsIg[si]);
            var frameUrlIg = isVidIg ? resolveVideoUrl(storyUrlsIg[si]) : resolveUrl(storyUrlsIg[si]);`;

  const NEW_IG_STORY = `for (var si = 0; si < storyUrlsIg.length; si++) {
            // Drive URLs sem extensão são tratadas como vídeo
            var isVidIg    = isVideoUrl(storyUrlsIg[si]) || isDriveUrl(storyUrlsIg[si]);
            var frameUrlIg = isVidIg ? resolveVideoUrl(storyUrlsIg[si]) : resolveUrl(storyUrlsIg[si]);`;

  if (code.includes(OLD_IG_STORY)) {
    code = code.replace(OLD_IG_STORY, NEW_IG_STORY);
    console.log('✅ Story Instagram: Drive URL → vídeo');
  } else {
    console.log('❌ Story Instagram: trecho não encontrado');
  }

  node.parameters.jsCode = code;
  fs.writeFileSync(file, JSON.stringify(wf, null, 2), 'utf8');
  console.log('✅ publicar-agendados.json salvo');
}
