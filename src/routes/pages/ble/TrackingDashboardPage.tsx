import { useState } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { useRooms, usePresence, useDevices } from '@/hooks/useBLE'
import { useWebSocketPresenceSync } from '@/hooks/useWebSocket'
import { AlertBanner } from '@/components/ble/AlertBanner'
import { ConnectionStatus } from '@/components/ble/ConnectionStatus'
import { RoomGrid } from '@/components/ble/RoomGrid'
import { ItemPresenceCard } from '@/components/ble/ItemPresenceCard'
import { DeviceStatusCard } from '@/components/ble/DeviceStatusCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bluetooth, MapPin, Package, Radio } from 'lucide-react'

export function TrackingDashboardPage() {
  useWebSocketPresenceSync()

  const { data: rooms, isLoading: roomsLoading } = useRooms()
  const { data: presence, isLoading: presenceLoading } = usePresence()
  const { data: devices, isLoading: devicesLoading } = useDevices()

  const [activeTab, setActiveTab] = useState('overview')
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)

  const isLoading = roomsLoading || presenceLoading || devicesLoading

  const presentCount = presence?.filter((p) => p.status === 'present').length || 0
  const missingCount = presence?.filter((p) => p.status === 'missing').length || 0
  const offlineDevices = devices?.filter((d) => d.status === 'offline').length || 0

  const filteredPresence = selectedRoomId
    ? presence?.filter((p) => p.room_id === selectedRoomId)
    : presence

  return (
    <PageShell
      title="BLE Tracking"
      description="Real-time asset tracking via Bluetooth"
      actions={<ConnectionStatus />}
    >
      <AlertBanner />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{presentCount}</p>
                <p className="text-sm text-muted-foreground">Items Present</p>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Bluetooth className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{missingCount}</p>
                <p className="text-sm text-muted-foreground">Items Missing</p>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Radio className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{offlineDevices}</p>
                <p className="text-sm text-muted-foreground">Devices Offline</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">
                <MapPin className="h-4 w-4 mr-2" />
                Rooms
              </TabsTrigger>
              <TabsTrigger value="items">
                <Package className="h-4 w-4 mr-2" />
                Items
              </TabsTrigger>
              <TabsTrigger value="devices">
                <Radio className="h-4 w-4 mr-2" />
                Devices
              </TabsTrigger>
            </TabsList>

            {/* Rooms Tab */}
            {activeTab === 'overview' && (
              <div className="mt-4 space-y-4">
                <RoomGrid
                  rooms={rooms || []}
                  presence={presence || []}
                  onRoomClick={(roomId) => {
                    setSelectedRoomId(roomId)
                    setActiveTab('items')
                  }}
                />
              </div>
            )}

            {/* Items Tab */}
            {activeTab === 'items' && (
              <div className="mt-4 space-y-4">
                {selectedRoomId && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => setSelectedRoomId(null)}
                    >
                      {rooms?.find((r) => r.id === selectedRoomId)?.name || 'Room'}
                      <span className="ml-2 text-muted-foreground">×</span>
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {filteredPresence?.length || 0} items
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPresence?.map((p) => (
                    <ItemPresenceCard key={p.item_id} presence={p} />
                  ))}
                </div>
                {(!filteredPresence || filteredPresence.length === 0) && (
                  <div className="text-center py-16 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No items to display.</p>
                  </div>
                )}
              </div>
            )}

            {/* Devices Tab */}
            {activeTab === 'devices' && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {devices?.map((device) => (
                  <DeviceStatusCard key={device.id} device={device} />
                ))}
                {(!devices || devices.length === 0) && (
                  <div className="text-center py-16 text-muted-foreground col-span-full">
                    <Radio className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No devices registered.</p>
                  </div>
                )}
              </div>
            )}
          </Tabs>
        </div>
      )}
    </PageShell>
  )
}
