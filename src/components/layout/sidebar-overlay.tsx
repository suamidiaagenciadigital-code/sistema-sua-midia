'use client'

import { useSidebar } from './sidebar-context'

export function SidebarOverlay() {
  const { open, setOpen } = useSidebar()
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-40 bg-black/60 lg:hidden"
      onClick={() => setOpen(false)}
    />
  )
}
