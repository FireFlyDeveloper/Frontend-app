import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, AlertCircle, Clock, Package, CheckCircle } from 'lucide-react'
import { PageShell } from '@/components/layout/PageShell'
import { ItemCard } from '@/components/inventory/ItemCard'
import { ItemForm } from '@/components/inventory/ItemForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/authStore'
import { useItems, useCreateItem } from '@/hooks/useItems'
import { useRooms } from '@/hooks/useBLE'
import { CreateItemInput, UpdateItemInput } from '@/types/inventory'

export function InventoryListPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const isAdminOrStaff = user?.roles?.includes('admin') || user?.roles?.includes('staff')

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roomFilter, setRoomFilter] = useState('')
  const [showForm, setShowForm] = useState(false)

  const { data: items, isLoading } = useItems({
    search: search || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    room: roomFilter || undefined,
  })

  const { data: rooms } = useRooms()
  const createItem = useCreateItem()

  const handleCreate = (data: CreateItemInput | UpdateItemInput) => {
    createItem.mutate(data as CreateItemInput, {
      onSuccess: () => setShowForm(false),
    })
  }

  // Show room filter when type is trackable or no type selected
  const showRoomFilter = typeFilter === 'trackable' || typeFilter === ''

  return (
    <PageShell
      title="Inventory"
      description="Manage trackable and quantifiable items"
      actions={
        isAdminOrStaff && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        )
      }
    >
      {/* KPI Dashboard - Expiration Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="rounded-lg border bg-card p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Expiring Soon</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-600">12</p>
            </div>
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Items expire in &lt;30 days</p>
        </div>
        
        <div className="rounded-lg border bg-card p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Expired Items</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600">3</p>
            </div>
            <Clock className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Past expiration date</p>
        </div>
        
        <div className="rounded-lg border bg-card p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Low Stock</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">8</p>
            </div>
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Below reorder point</p>
        </div>
        
        <div className="rounded-lg border bg-card p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">In Compliance</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">247</p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">All requirements met</p>
        </div>
      </div>

      {/* Filters - Grid layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setRoomFilter('') }}>
          <option value="">All Types</option>
          <option value="quantifiable">Quantifiable</option>
          <option value="trackable">Trackable</option>
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
        </Select>
        {showRoomFilter && rooms && rooms.length > 0 && (
          <div className="sm:col-span-2 lg:col-span-1">
            <Select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)}>
              <option value="">All Rooms</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 sm:h-32" />
          ))}
        </div>
      ) : items && items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onClick={() => navigate(`/inventory/${item.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-muted-foreground">
          <Filter className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 opacity-50" />
          <p className="text-base sm:text-lg font-medium">No items found</p>
          <p className="text-xs sm:text-sm">Try adjusting your filters</p>
        </div>
      )}

      <ItemForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleCreate}
        isLoading={createItem.isPending}
      />
    </PageShell>
  )
}
