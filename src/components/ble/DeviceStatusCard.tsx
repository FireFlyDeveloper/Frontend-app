import { BleDevice } from '@/types/ble'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeviceStatusCardProps {
  device: BleDevice
}

export function DeviceStatusCard({ device }: DeviceStatusCardProps) {
  const isOnline = device.status === 'online'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base truncate">{device.name}</CardTitle>
          <Badge
            variant={isOnline ? 'default' : 'destructive'}
            className={cn('text-xs', isOnline && 'bg-green-600 hover:bg-green-600')}
          >
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 shrink-0" />
          <span className="font-mono text-xs">{device.device_id}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">{device.room_name || 'Unassigned'}</span>
        </div>
        {device.last_seen && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{new Date(device.last_seen).toLocaleString()}</span>
          </div>
        )}
        {device.rssi_range !== null && device.rssi_range !== undefined && (
          <div className="text-xs">RSSI Range: {device.rssi_range} dBm</div>
        )}
      </CardContent>
    </Card>
  )
}
