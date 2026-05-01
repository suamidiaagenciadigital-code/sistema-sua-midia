import { logout } from '@/app/login/actions'
import { createClient } from '@/lib/supabase/server'
import { LogOut } from 'lucide-react'

export async function AppHeader() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header
      className="h-14 flex items-center justify-between px-6 shrink-0"
      style={{
        backgroundColor: '#0f1929',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500">{user?.email}</span>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </form>
      </div>
    </header>
  )
}
