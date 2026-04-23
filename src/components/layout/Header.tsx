import { useAuthStore } from '@/stores/authStore'
import { useLogout } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { LogOut, Menu } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'

export function Header() {
  const user = useAuthStore((state) => state.user)
  const logout = useLogout()
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden rounded-md p-2 hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">Dragonfly Platform</h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {user?.email}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {logout.isPending ? 'Logging out...' : 'Logout'}
        </Button>
      </div>
    </header>
  )
}
