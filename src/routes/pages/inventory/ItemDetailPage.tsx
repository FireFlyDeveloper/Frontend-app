import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, Box, Package, AlertTriangle } from 'lucide-react'
import { PageShell } from '@/components/layout/PageShell'
import { ItemForm } from '@/components/inventory/ItemForm'
import { LotForm } from '@/components/inventory/LotForm'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/authStore'
import { useItem, useUpdateItem, useDeleteItem } from '@/hooks/useItems'
import { useLots, useCreateLot } from '@/hooks/useLots'
import { UpdateItemInput, CreateLotInput } from '@/types/inventory'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
}

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const isAdminOrStaff = user?.roles?.includes('admin') || user?.roles?.includes('staff')

  const [showEditForm, setShowEditForm] = useState(false)
  const [showLotForm, setShowLotForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: item, isLoading: itemLoading } = useItem(id || null)
  const { data: lots, isLoading: lotsLoading } = useLots(id || null)

  const updateItem = useUpdateItem()
  const deleteItem = useDeleteItem()
  const createLot = useCreateLot()

  const handleUpdate = (data: UpdateItemInput) => {
    if (!id) return
    updateItem.mutate({ id, data }, { onSuccess: () => setShowEditForm(false) })
  }

  const handleDelete = () => {
    if (!id) return
    deleteItem.mutate(id, { onSuccess: () => navigate('/inventory') })
  }

  const handleCreateLot = (data: CreateLotInput) => {
    if (!id) return
    createLot.mutate({ itemId: id, data }, { onSuccess: () => setShowLotForm(false) })
  }

  if (itemLoading) {
    return (
      <PageShell title="Item Details">
        <Skeleton className="h-40" />
        <Skeleton className="h-60 mt-4" />
      </PageShell>
    )
  }

  if (!item) {
    return (
      <PageShell title="Item Not Found">
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Package className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">Item not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/inventory')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={item.name}
      description={item.description || undefined}
      actions={
        isAdminOrStaff && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowEditForm(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )
      }
    >
      <Button variant="ghost" size="sm" className="mb-2" onClick={() => navigate('/inventory')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Item Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                {item.item_type === 'quantifiable' ? (
                  <Box className="h-6 w-6 text-primary" />
                ) : (
                  <Package className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{item.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={cn('text-xs', statusColors[item.status])}>
                    {item.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground capitalize">{item.item_type}</span>
                  {item.category && (
                    <span className="text-xs text-muted-foreground">{item.category}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lots Section (quantifiable only) */}
      {item.item_type === 'quantifiable' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Lots</CardTitle>
            {isAdminOrStaff && (
              <Button size="sm" onClick={() => setShowLotForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lot
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {lotsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : lots && lots.length > 0 ? (
              <div className="space-y-2">
                {lots.map((lot) => (
                  <div key={lot.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{lot.lot_code}</p>
                      {(lot.purchased_at || lot.expires_at) && (
                        <p className="text-xs text-muted-foreground">
                          {lot.purchased_at && `Purchased: ${new Date(lot.purchased_at).toLocaleDateString()}`}
                          {lot.purchased_at && lot.expires_at && ' · '}
                          {lot.expires_at && `Expires: ${new Date(lot.expires_at).toLocaleDateString()}`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-3 text-sm">
                        <span>Total: <strong>{lot.quantity_total}</strong></span>
                        <span>On Hand: <strong className="text-green-700">{lot.quantity_on_hand}</strong></span>
                        <span>Out: <strong className="text-amber-700">{lot.quantity_out}</strong></span>
                      </div>
                      {lot.quantity_on_hand === 0 && (
                        <div className="flex items-center justify-end gap-1 text-xs text-destructive mt-1">
                          <AlertTriangle className="h-3 w-3" />
                          Out of stock
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No lots yet</p>
                {isAdminOrStaff && <p className="text-xs">Add a lot to track quantities</p>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      <ItemForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        onSubmit={handleUpdate}
        item={item}
        isLoading={updateItem.isPending}
      />

      {/* Lot Form */}
      <LotForm
        open={showLotForm}
        onOpenChange={setShowLotForm}
        onSubmit={handleCreateLot}
        isLoading={createLot.isPending}
      />

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative z-50 bg-background rounded-lg shadow-lg max-w-sm w-full mx-4 p-6">
            <h3 className="text-lg font-semibold">Delete Item</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete <strong>{item.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteItem.isPending}>
                {deleteItem.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
