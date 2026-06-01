'use client'

import { createContext, useContext, useState } from 'react'

type SidebarCtx = { open: boolean; setOpen: (v: boolean) => void }

const SidebarContext = createContext<SidebarCtx>({ open: false, setOpen: () => {} })

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
