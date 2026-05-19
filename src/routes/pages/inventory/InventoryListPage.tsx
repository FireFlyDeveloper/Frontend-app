import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter } from 'lucide-react'
import { PageShell } from '@/components/layout/PageShell'
import { ItemCard } from '@/components/inventory/ItemCard'
import { ItemForm } from '@/components/inventory/ItemForm'
import { InventoryExpirationKPIs, InventoryItemWithExpiration } from '@/components/inventory/ExpirationKPIs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import { useItems, useCreateItem } from '@/hooks/useItems'
import { useRooms } from '@/hooks/useBLE'
import { Item, CreateItemInput, UpdateItemInput } from '@/types/inventory'

export function InventoryListPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const isAdminOrStaff = user?.roles?.includes('admin') || user?.roles?.includes('staff')

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roomFilter, setRoomFilter] = useState('')
  const [expirationFilter, setExpirationFilter] = useState<'expired' | 'near-expiry' | 'safe' | 'all'>('all')
  const [expirationThreshold, setExpirationThreshold] = useState<number>(7)
  const [showForm, setShowForm] = useState(false)

  const { data: items, isLoading } = useItems({
    search: search || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    room: roomFilter || undefined,
  })

  const { data: rooms } = useRooms()
  const createItem = useCreateItem()

  // Convert items to InventoryItemWithExpiration format
  const itemsWithExpiration = useMemo((): InventoryItemWithExpiration[] => {
    if (!items) return []
    // For now, return items with empty lots array
    // In a real implementation, we would fetch lots for each item
    return items.map(item => ({
      ...item,
      lots: [], // Placeholder - would need to fetch lots from API
      totalQuantity: 0 // Placeholder
    }))
  }, [items])

  // Filter items based on expiration status
  const filteredItems = useMemo(() => {
    if (!items || expirationFilter === 'all') return items

    // For now, return all items since we don't have real lot data
    // In a real implementation, we would filter based on actual expiration dates
    return items

    // TODO: Implement actual expiration filtering when we have lot data
    // This would involve checking each item's lots against expirationFilter
  }, [items, expirationFilter, expirationThreshold])

  const handleExpirationFilterChange = (filter: 'expired' | 'near-expiry' | 'safe' | 'all', days?: number) => {
    setExpirationFilter(filter)
    if (days) {
      setExpirationThreshold(days)
    }
  }

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
      {/* Expiration KPIs Dashboard */}
      <InventoryExpirationKPIs
        items={itemsWithExpiration}
        isLoading={isLoading}
        configurableThresholds={[7, 14, 30]}
        onFilterChange={handleExpirationFilterChange}
      />

      {/* Critical Alert Badge */}
      {itemsWithExpiration.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1" />
          {expirationFilter !== 'all' && (
            <Badge variant="destructive" className="px-3 py-1">
              Filter: {expirationFilter === 'expired' ? 'Expired Items' : 
                      expirationFilter === 'near-expiry' ? `Expiring within ${expirationThreshold} days` : 
                      'Safe Items'}
            </Badge>
          )}
          <Badge variant="secondary" className="px-3 py-1">
            {filteredItems?.length || 0} items shown
          </Badge>
        </div>
      )}

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
      ) : filteredItems && filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredItems.map((item) => (
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
