import { useState } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { useDevices, useCreateDevice, useUpdateDevice, useDeleteDevice, useRooms } from '@/hooks/useBLE'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DeviceStatusCard } from '@/components/ble/DeviceStatusCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Cpu } from 'lucide-react'
import { BleDevice } from '@/types/ble'

export function DevicesPage() {
  const { data: devices, isLoading } = useDevices()
  const { data: rooms } = useRooms()
  const createDevice = useCreateDevice()
  const updateDevice = useUpdateDevice()
  const deleteDevice = useDeleteDevice()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<BleDevice | null>(null)
  const [deviceId, setDeviceId] = useState('')
  const [name, setName] = useState('')
  const [roomId, setRoomId] = useState('')
  const [rssiRange, setRssiRange] = useState<number | ''>('')

  const openCreate = () => {
    setEditingDevice(null)
    setDeviceId('')
    setName('')
    setRoomId('')
    setRssiRange('')
    setDialogOpen(true)
  }

  const openEdit = (device: BleDevice) => {
    setEditingDevice(device)
    setDeviceId(device.device_id)
    setName(device.name)
    setRoomId(device.room_id || '')
    setRssiRange(device.rssi_range ?? '')
    setDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!deviceId.trim() || !name.trim()) return

    if (editingDevice) {
      updateDevice.mutate({
        id: editingDevice.id,
        data: {
          name,
          room_id: roomId || null,
          rssi_range: rssiRange !== '' ? Number(rssiRange) : undefined,
        },
      })
    } else {
      createDevice.mutate({
        device_id: deviceId,
        name,
        room_id: roomId || undefined,
        rssi_range: rssiRange !== '' ? Number(rssiRange) : undefined,
      })
    }
    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this device?')) {
      deleteDevice.mutate(id)
    }
  }

  return (
    <PageShell
      title="BLE Devices"
      description="Manage BLE gateway devices"
      actions={
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Register Device
        </Button>
      }
    >
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : !devices || devices.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Cpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No devices registered yet.</p>
          <Button variant="outline" className="mt-4" onClick={openCreate}>
            Register your first device
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <div key={device.id} className="relative group">
              <div onClick={() => openEdit(device)}>
                <DeviceStatusCard device={device} />
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(device.id)}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDevice ? 'Edit Device' : 'Register Device'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deviceId">Device ID</Label>
              <Input
                id="deviceId"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="e.g. ble-gw-001"
                required
                disabled={!!editingDevice}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lab A Gateway"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room">Room</Label>
              <Select
                id="room"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {rooms?.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rssi">RSSI Range (dBm)</Label>
              <Input
                id="rssi"
                type="number"
                value={rssiRange}
                onChange={(e) => setRssiRange(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. -70"
              />
              <p className="text-xs text-muted-foreground">Threshold for detecting presence in this room. Smaller rooms can use a higher value (e.g. -60).</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createDevice.isPending || updateDevice.isPending}>
                {editingDevice ? 'Update' : 'Register'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
