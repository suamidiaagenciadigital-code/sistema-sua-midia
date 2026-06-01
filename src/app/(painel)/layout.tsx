import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { SidebarProvider } from '@/components/layout/sidebar-context'
import { SidebarOverlay } from '@/components/layout/sidebar-overlay'

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarOverlay />
      <div className="flex h-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <AppHeader />
          <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
