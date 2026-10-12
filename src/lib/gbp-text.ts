// Adaptação do texto do Instagram para um post do Google Business Profile.
// Função pura: usada no servidor (publicação) e no navegador (prévia).
//
// Regras: o Google não usa hashtags, não tem @, rejeita telefone e links soltos
// no texto (o link vai no botão) e limita o resumo a 1500 caracteres.

const MAX = 1500

export function adaptPostForGbp(caption: string | null | undefined): string {
  let t = (caption ?? '').replace(/\r\n/g, '\n')

  t = t.replace(/\*\*([\s\S]+?)\*\*|__([\s\S]+?)__/g, '$1$2').replace(/\*/g, '') // negrito/itálico em markdown: o Google mostra os asteriscos
  t = t.replace(/https?:\/\/\S+|www\.\S+/gi, '')                   // links
  t = t.replace(/(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/g, '') // telefones BR
  t = t.replace(/(^|\s)@[\w.]+/g, '$1')                            // menções
  t = t.replace(/(^|\s)#[\p{L}\p{N}_]+/gu, '$1')                   // hashtags
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
