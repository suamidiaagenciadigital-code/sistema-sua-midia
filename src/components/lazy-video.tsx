'use client'

import { useEffect, useRef, useState, type VideoHTMLAttributes } from 'react'

// <video> que só pede o arquivo quando chega perto da tela.
//
// Motivo: as páginas de aprovação e do portal montavam dezenas de <video
// preload="metadata">, e cada um baixa alguns MB só para mostrar o primeiro
// quadro. O navegador fazia isso para TODOS os vídeos da página, mesmo os que o
// cliente nunca rolou até ver — e cada visita repetia o gasto. Isso era a
// principal fonte da banda (cached egress) do plano gratuito do Supabase.
//
// Até entrar na área visível (margem de 300px) renderiza só uma caixa preta do
// mesmo tamanho; depois vira o <video> normal, com os mesmos atributos.
export function LazyVideo(props: VideoHTMLAttributes<HTMLVideoElement>) {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    if (near) return
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') { setNear(true); return }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) { setNear(true); io.disconnect() }
      },
      { rootMargin: '300px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [near])

  if (!near) {
    return <div ref={ref} className={props.className} style={{ background: '#000', ...props.style }} />
  }
  // eslint-disable-next-line jsx-a11y/media-has-caption
  return <video {...props} />
}
