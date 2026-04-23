import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, XCircle, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select } from '@/components/ui/select'
import { useAuthStore } from '@/stores/authStore'
import { useCheckouts, useCheckout, useReturnCheckout, useCancelCheckout } from '@/hooks/useCheckout'
import { CheckoutStatus, ReturnLine } from '@/types/inventory'
import { cn } from '@/lib/utils'

const statusConfig: Record<CheckoutStatus, { label: string; icon: React.ReactNode; color: string }> = {
  open: { label: 'Open', icon: <Clock className="h-3 w-3" />, color: 'bg-blue-100 text-blue-800' },
  partially_returned: { label: 'Partially Returned', icon: <AlertCircle className="h-3 w-3" />, color: 'bg-amber-100 text-amber-800' },
  closed: { label: 'Closed', icon: <CheckCircle className="h-3 w-3" />, color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', icon: <XCircle className="h-3 w-3" />, color: 'bg-gray-100 text-gray-800' },
}

export function CheckoutHistoryPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const isAdminOrStaff = user?.roles?.includes('admin') || user?.roles?.includes('staff')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedCheckoutId, setSelectedCheckoutId] = useState<string | null>(null)
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({})

  const { data: checkouts, isLoading } = useCheckouts({
    status: statusFilter || undefined,
  })

  const { data: checkoutDetail } = useCheckout(selectedCheckoutId)
  const returnCheckout = useReturnCheckout()
  const cancelCheckout = useCancelCheckout()

  const handleReturn = (checkoutId: string) => {
    if (!checkoutDetail) return
    const lines: ReturnLine[] = checkoutDetail.items
      .filter((item) => {
        const qty = returnQuantities[item.id] || 0
        return qty > 0
      })
      .map((item) => ({
        checkout_item_id: item.id,
        quantity: returnQuantities[item.id],
      }))

    if (lines.length === 0) return

    returnCheckout.mutate({ id: checkoutId, data: { lines } }, {
      onSuccess: () => {
        setReturnQuantities({})
        setSelectedCheckoutId(null)
      },
    })
  }

  const canReturn = (status: CheckoutStatus) => status === 'open' || status === 'partially_returned'
  const canCancel = (status: CheckoutStatus) => status === 'open'

  return (
    <PageShell title="Checkout History" description="View and manage checkouts">
      <Button variant="ghost" size="sm" className="mb-2" onClick={() => navigate('/inventory')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Inventory
      </Button>

      <div className="flex items-center gap-2 mb-4">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="partially_returned">Partially Returned</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : checkouts && checkouts.length > 0 ? (
        <div className="space-y-3">
          {checkouts.map((txn) => {
            const status = statusConfig[txn.status]
            const isSelected = selectedCheckoutId === txn.id
            return (
              <Card key={txn.id} className={cn(isSelected && 'border-primary')}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Checkout #{txn.id.slice(0, 8)}</span>
                        <Badge variant="outline" className={cn('text-xs flex items-center gap-1', status.color)}>
                          {status.icon}
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(txn.created_at).toLocaleString()}
                      </p>
                      {txn.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{txn.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {canReturn(txn.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCheckoutId(isSelected ? null : txn.id)
                            setReturnQuantities({})
                          }}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Return
                        </Button>
                      )}
                      {isAdminOrStaff && canCancel(txn.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => cancelCheckout.mutate(txn.id)}
                          disabled={cancelCheckout.isPending}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Return Panel */}
                  {isSelected && checkoutDetail && (
                    <div className="mt-4 border-t pt-4 space-y-3">
                      <h4 className="text-sm font-semibold">Select items to return</h4>
                      {checkoutDetail.items.map((item) => {
                        const remaining = item.quantity_out - item.quantity_returned
                        if (remaining <= 0) return null
                        const returnQty = returnQuantities[item.id] || 0
                        return (
                          <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                              <p className="text-sm font-medium">{item.item_name}</p>
                              <p className="text-xs text-muted-foreground">{item.lot_code}</p>
                              <p className="text-xs text-muted-foreground">
                                Checked out: {item.quantity_out} · Already returned: {item.quantity_returned} · Remaining: {remaining}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                max={remaining}
                                value={returnQty}
                                onChange={(e) =>
                                  setReturnQuantities((prev) => ({
                                    ...prev,
                                    [item.id]: Math.min(remaining, Math.max(0, Number(e.target.value))),
                                  }))
                                }
                                className="w-16 h-8 rounded-md border border-input bg-background px-2 text-sm text-center"
                              />
                            </div>
                          </div>
                        )
                      })}
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedCheckoutId(null)}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReturn(txn.id)}
                          disabled={returnCheckout.isPending || Object.values(returnQuantities).every((v) => v <= 0)}
                        >
                          {returnCheckout.isPending ? 'Processing...' : 'Confirm Return'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Package className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No checkouts found</p>
        </div>
      )}
    </PageShell>
  )
}
