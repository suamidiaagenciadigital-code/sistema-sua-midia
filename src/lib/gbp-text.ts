// Adaptação do texto do Instagram para um post do Google Business Profile.
// Função pura: usada no servidor (publicação) e no navegador (prévia).
//
// Regras: o Google não usa hashtags, não tem @, rejeita telefone e links soltos
// no texto (o link vai no botão) e limita o resumo a 1500 caracteres.

const MAX = 1500

export function adaptPostForGbp(caption: string | null | undefined): string {
  let t = (caption ?? '').replace(/\r\n/g, '\n')

  t = t.replace(/\*\*([\s\S]+?)\*\*|__([\s\S]+?)__/g, '$1$2').replace(/\*/g, '') // negrito/itálico em markdown: o Google mostra os asteriscos
  // Links, telefones, menções e hashtags saem linha a linha. Se a remoção deixa a
  // linha sem texto ou só com um rótulo ("📲 WhatsApp:", "🌐"), a linha toda sai.
  t = t
    .split('\n')
    .map((line) => {
      const clean = line
        .replace(/https?:\/\/\S+|www\.\S+/gi, '')                        // links
        .replace(/(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/g, '')   // telefones BR
        .replace(/(^|\s)@[\w.]+/g, '$1')                                 // menções
        .replace(/(^|\s)#[\p{L}\p{N}_]+/gu, '$1')                        // hashtags
      if (clean === line) return line
      const t2 = clean.trim()
      return !/[\p{L}\p{N}]/u.test(t2) || /:$/.test(t2) ? '' : clean
    })
    .join('\n')
  t = t.replace(/\s*[—–]\s*/g, ', ')                               // sem travessão
  t = t
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (t.length > MAX) {
    const cut = t.slice(0, MAX)
    const lastSpace = cut.lastIndexOf(' ')
    t = (lastSpace > MAX * 0.6 ? cut.slice(0, lastSpace) : cut).trim()
  }
  return t
}
