import { PageShell } from '@/components/layout/PageShell'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardStats, useRecentActivity, useRoomStatus } from '@/hooks/useDashboard'
import { StatCard, ActivityFeed, RoomStatusCard } from '@/components/dashboard'
import {
  Package,
  FileText,
  Users,
  AlertTriangle,
  Radio,
  ShoppingCart,
  ClipboardList,
} from 'lucide-react'

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: activity, isLoading: activityLoading } = useRecentActivity(20)
  const { data: rooms, isLoading: roomsLoading } = useRoomStatus()

  return (
    <PageShell
      title={`Welcome, ${user?.display_name || 'User'}`}
      description="Here's an overview of your platform"
    >
      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Items"
          value={stats?.totalItems ?? 0}
          icon={<Package className="h-5 w-5" />}
          colorClass="bg-green-100 text-green-600"
          isLoading={statsLoading}
        />
        <StatCard
          label="Documents"
          value={stats?.totalDocuments ?? 0}
          icon={<FileText className="h-5 w-5" />}
          colorClass="bg-blue-100 text-blue-600"
          isLoading={statsLoading}
        />
        <StatCard
          label="Users"
          value={stats?.totalUsers ?? 0}
          icon={<Users className="h-5 w-5" />}
          colorClass="bg-purple-100 text-purple-600"
          isLoading={statsLoading}
        />
        <StatCard
          label="Missing Items"
          value={stats?.missingItemsCount ?? 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          colorClass="bg-red-100 text-red-600"
          isLoading={statsLoading}
        />
        <StatCard
          label="Offline Devices"
          value={stats?.offlineDevicesCount ?? 0}
          icon={<Radio className="h-5 w-5" />}
          colorClass="bg-orange-100 text-orange-600"
          isLoading={statsLoading}
        />
        <StatCard
          label="Recent Checkouts"
          value={stats?.recentCheckoutsCount ?? 0}
          icon={<ShoppingCart className="h-5 w-5" />}
          colorClass="bg-pink-100 text-pink-600"
          isLoading={statsLoading}
        />
        <StatCard
          label="Active Checkouts"
          value={stats?.activeCheckoutsCount ?? 0}
          icon={<ClipboardList className="h-5 w-5" />}
          colorClass="bg-cyan-100 text-cyan-600"
          isLoading={statsLoading}
        />
      </div>

      {/* Activity + Room Status */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <ActivityFeed activity={activity} isLoading={activityLoading} />
        <RoomStatusCard rooms={rooms} isLoading={roomsLoading} />
      </div>
    </PageShell>
  )
}
