'use client'

import { Menu } from 'lucide-react'
import { useSidebar } from './sidebar-context'

export function MobileMenuButton() {
  const { setOpen } = useSidebar()
  return (
    <button
      className="lg:hidden p-2 -ml-1 text-slate-400 hover:text-white transition-colors"
      onClick={() => setOpen(true)}
      aria-label="Abrir menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}
