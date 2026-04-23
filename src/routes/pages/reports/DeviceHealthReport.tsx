import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useDeviceHealthReport } from '@/hooks/useReports'
import { exportToCSV, exportToJSON } from '@/lib/export'
import { FileDown, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DeviceHealthReport() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const filters = {
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  }

  const { data, isLoading } = useDeviceHealthReport(filters)

  const handleExportCSV = () => {
    if (!data) return
    exportToCSV(
      data.map((d) => ({
        deviceId: d.deviceId,
        deviceName: d.deviceName,
        roomName: d.roomName || 'Unassigned',
        status: d.status,
        lastSeen: d.lastSeen || 'Never',
        uptimePercent: d.uptimePercent != null ? `${d.uptimePercent}%` : 'N/A',
      })),
      `device-health-${new Date().toISOString().split('T')[0]}.csv`,
      {
        deviceId: 'Device ID',
        deviceName: 'Device Name',
        roomName: 'Room',
        status: 'Status',
        lastSeen: 'Last Seen',
        uptimePercent: 'Uptime',
      }
    )
  }

  const handleExportJSON = () => {
    if (!data) return
    exportToJSON(data, `device-health-${new Date().toISOString().split('T')[0]}.json`)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!data || data.length === 0}>
                <FileDown className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportJSON} disabled={!data || data.length === 0}>
                <FileDown className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Device Health</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Device</th>
                <th className="text-left px-4 py-3 font-medium">Room</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Last Seen</th>
                <th className="text-left px-4 py-3 font-medium">Uptime</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                  </tr>
                ))
              ) : data && data.length > 0 ? (
                data.map((row) => (
                  <tr key={row.deviceId} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{row.deviceName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.roomName || 'Unassigned'}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs capitalize',
                          row.status === 'online'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        )}
                      >
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {row.lastSeen ? new Date(row.lastSeen).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {row.uptimePercent != null ? `${row.uptimePercent}%` : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <Radio className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No device data for selected range</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
