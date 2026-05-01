'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  MessageSquare,
  Megaphone,
  Settings,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/approvals', label: 'Aprovações', icon: CheckSquare },
  { href: '/support', label: 'Atendimento', icon: MessageSquare },
  { href: '/ads', label: 'Anúncios', icon: Megaphone },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

function SuaMidiaLogo() {
  return (
    <div className="flex items-center gap-3">
      {/* Ícone swoosh — gradiente azul→roxo */}
      <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <defs>
          <linearGradient id="lg-sidebar" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2B80FF" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
        {/* Lâmina superior */}
        <path
          d="M12 72 C18 40, 38 18, 62 14 C78 11, 90 22, 88 42 C86 58, 70 66, 54 63 C40 60, 32 50, 38 40 C44 30, 60 33, 62 46"
          stroke="url(#lg-sidebar)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none"
        />
        {/* Lâmina inferior — asa */}
        <path
          d="M12 80 C28 70, 46 72, 62 78 C74 83, 86 78, 90 68"
          stroke="url(#lg-sidebar)" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.55"
        />
      </svg>
      <div className="leading-none">
        <p className="text-base font-extrabold text-white tracking-tight">Sua Mídia</p>
        <p className="text-[10px] font-semibold tracking-widest mt-0.5 lumina-gradient-text uppercase">Agência Digital</p>
      </div>
    </div>
  )
}

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="w-60 shrink-0 flex flex-col h-full"
      style={{ backgroundColor: '#0f1929', borderRight: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Logo */}
      <div
        className="px-5 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <SuaMidiaLogo />
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
              style={
                active
                  ? {
                      background: 'linear-gradient(to right, rgba(43,128,255,0.18), rgba(168,85,247,0.08))',
                      borderLeft: '3px solid #2B80FF',
                      color: '#ffffff',
                      fontWeight: 600,
                    }
                  : {
                      borderLeft: '3px solid transparent',
                      color: '#64748b',
                    }
              }
              onMouseEnter={e => {
                if (!active) {
                  ;(e.currentTarget as HTMLElement).style.color = '#cbd5e1'
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  ;(e.currentTarget as HTMLElement).style.color = '#64748b'
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                }
              }}
            >
              <Icon
                className="h-4 w-4 shrink-0"
                style={{ color: active ? '#2B80FF' : 'currentColor' }}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-4 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="text-[11px] text-slate-600 text-center">Sistema v1.0 · Sprint 4</p>
      </div>
    </aside>
  )
}
