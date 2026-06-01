'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  MessageSquare,
  Megaphone,
  FileText,
  Settings,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/approvals', label: 'Aprovações', icon: CheckSquare },
  { href: '/support', label: 'Atendimento', icon: MessageSquare },
  { href: '/ads', label: 'Anúncios', icon: Megaphone },
  { href: '/propostas', label: 'Propostas', icon: FileText },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

function SuaMidiaLogo() {
  return (
    <Image
      src="/logotipo-2023 (horizontal) - branco.png"
      alt="Sua Mídia — Agência Digital"
      width={180}
      height={48}
      priority
      className="w-auto"
      style={{ maxHeight: 48 }}
    />
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 lumina-nav-item ${active ? 'lumina-nav-active' : ''}`}
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
