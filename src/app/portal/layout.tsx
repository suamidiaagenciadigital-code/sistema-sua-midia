import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portal do Cliente — Sua Mídia',
  description: 'Acompanhe suas publicações e resultados',
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0b1326]">
      {children}
    </div>
  )
}
