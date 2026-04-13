'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Image,
  Sparkles,
  CalendarDays,
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

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 shrink-0 border-r border-zinc-800 bg-zinc-900 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-zinc-800">
        <span className="text-lg font-bold text-white tracking-tight">Sua Mídia</span>
        <p className="text-xs text-zinc-500 mt-0.5">Painel da Agência</p>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-zinc-700 text-white font-medium'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-zinc-800">
        <p className="text-xs text-zinc-600 text-center">Sistema v1.0 · Sprint 4</p>
      </div>
    </aside>
  )
}
