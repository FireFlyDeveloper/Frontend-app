import { PageShell } from '@/components/layout/PageShell'
import { Users } from 'lucide-react'

export function UsersPage() {
  return (
    <PageShell
      title="User Management"
      description="Manage platform users and roles"
    >
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Users className="h-16 w-16 mb-4 opacity-50" />
        <h2 className="text-xl font-semibold">User Management</h2>
        <p className="text-sm mt-2">Coming in Phase 4</p>
      </div>
    </PageShell>
  )
}
