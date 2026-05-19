import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, XCircle, Package, Clock, CheckCircle, AlertCircle, Hourglass, Ban, ThumbsUp, ThumbsDown, ChevronDown, Check, ListFilter, HelpCircle } from 'lucide-react'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select } from '@/components/ui/select'
import { useAuthStore } from '@/stores/authStore'
import { useCheckouts, useCheckout, useReturnCheckout, useCancelCheckout, useApproveCheckout, useRejectCheckout } from '@/hooks/useCheckout'
import { CheckoutStatus, ReturnLine } from '@/types/inventory'
import { cn } from '@/lib/utils'

const statusConfig: Record<CheckoutStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pending_approval: { label: 'Pending Approval', icon: <Hourglass className="h-3 w-3" />, color: 'bg-yellow-100 text-yellow-800' },
  open: { label: 'Open', icon: <Clock className="h-3 w-3" />, color: 'bg-blue-100 text-blue-800' },
  approved: { label: 'Approved', icon: <ThumbsUp className="h-3 w-3" />, color: 'bg-green-100 text-green-800' },
  partially_returned: { label: 'Partially Returned', icon: <AlertCircle className="h-3 w-3" />, color: 'bg-amber-100 text-amber-800' },
  closed: { label: 'Closed', icon: <CheckCircle className="h-3 w-3" />, color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', icon: <XCircle className="h-3 w-3" />, color: 'bg-gray-100 text-gray-800' },
  rejected: { label: 'Rejected', icon: <Ban className="h-3 w-3" />, color: 'bg-red-100 text-red-800' },
}

interface ReturnItem {
  id: string;
  quantity: number;
  maxQuantity: number;
  itemName: string;
  lotCode: string;
  checkedOut: number;
  alreadyReturned: number;
}

export function CheckoutHistoryPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const isAdminOrStaff = user?.roles?.includes('admin') || user?.roles?.includes('staff')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedCheckoutId, setSelectedCheckoutId] = useState<string | null>(null)
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({})
  const [selectedReturnItems, setSelectedReturnItems] = useState<Set<string>>(new Set())
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false)
  const [returnMode, setReturnMode] = useState<'specific' | 'all'>('specific')

  const { data: checkouts, isLoading } = useCheckouts({
    status: statusFilter || undefined,
  })

  const { data: checkoutDetail } = useCheckout(selectedCheckoutId)
  const returnCheckout = useReturnCheckout()
  const cancelCheckout = useCancelCheckout()
  const approveCheckout = useApproveCheckout()
  const rejectCheckout = useRejectCheckout()

  // Calculate available return items
  const availableReturnItems = useMemo((): ReturnItem[] => {
    if (!checkoutDetail || !checkoutDetail.items) return []
    
    return checkoutDetail.items
      .map(item => {
        const remaining = item.quantity_out - item.quantity_returned
        if (remaining <= 0) return null
        
        return {
          id: item.id,
          quantity: returnQuantities[item.id] || 0,
          maxQuantity: remaining,
          itemName: item.item_name,
          lotCode: item.lot_code,
          checkedOut: item.quantity_out,
          alreadyReturned: item.quantity_returned,
        }
      })
      .filter(Boolean) as ReturnItem[]
  }, [checkoutDetail, returnQuantities])

  // Handle "Return All" action
  const handleReturnAll = useCallback(() => {
    if (!checkoutDetail || !checkoutDetail.items) return
    
    const newQuantities: Record<string, number> = {}
    const newSelected = new Set<string>()
    
    checkoutDetail.items.forEach(item => {
      const remaining = item.quantity_out - item.quantity_returned
      if (remaining > 0) {
        newQuantities[item.id] = remaining
        newSelected.add(item.id)
      }
    })
    
    setReturnQuantities(newQuantities)
    setSelectedReturnItems(newSelected)
    setReturnMode('all')
  }, [checkoutDetail])

  // Handle item selection from dropdown
  const handleToggleItem = useCallback((itemId: string) => {
    const newSelected = new Set(selectedReturnItems)
    const item = availableReturnItems.find(i => i.id === itemId)
    
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
      setReturnQuantities(prev => ({ ...prev, [itemId]: 0 }))
    } else {
      newSelected.add(itemId)
      if (item) {
        setReturnQuantities(prev => ({ ...prev, [itemId]: item.maxQuantity }))
      }
    }
    
    setSelectedReturnItems(newSelected)
    setReturnMode('specific')
  }, [selectedReturnItems, availableReturnItems])

  // Handle quantity change with validation
  const handleQuantityChange = useCallback((itemId: string, value: number) => {
    const item = availableReturnItems.find(i => i.id === itemId)
    if (!item) return
    
    // Validate within bounds
    const validValue = Math.max(0, Math.min(item.maxQuantity, value))
    
    setReturnQuantities(prev => ({ ...prev, [itemId]: validValue }))
    
    // Auto-select item if quantity > 0
    if (validValue > 0 && !selectedReturnItems.has(itemId)) {
      setSelectedReturnItems(prev => new Set(prev).add(itemId))
    }
    
    // Auto-deselect item if quantity becomes 0
    if (validValue === 0 && selectedReturnItems.has(itemId)) {
      setSelectedReturnItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
    
    setReturnMode('specific')
  }, [availableReturnItems, selectedReturnItems])

  // Clear return state
  const clearReturnState = useCallback(() => {
    setReturnQuantities({})
    setSelectedReturnItems(new Set())
    setReturnMode('specific')
    setIsItemDropdownOpen(false)
  }, [])

  const handleReturn = (checkoutId: string) => {
    if (!checkoutDetail || !checkoutDetail.items) return
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
        clearReturnState()
        setSelectedCheckoutId(null)
      },
    })
  }

  const canReturn = (status: CheckoutStatus) => status === 'open' || status === 'partially_returned'
  const canCancel = (status: CheckoutStatus) => status === 'open' || status === 'pending_approval'
  const canApprove = (status: CheckoutStatus) => status === 'pending_approval'

  function renderNotes(notes: string | null | undefined) {
    if (!notes) return null
    try {
      const parsed = JSON.parse(notes)
      if (parsed.name && parsed.email) {
        return (
          <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
            <p className="font-medium text-foreground/80">Borrower Info</p>
            <p>Name: {parsed.name}</p>
            <p>Email: {parsed.email}</p>
            {parsed.srcode && <p>SR-Code: {parsed.srcode}</p>}
            {parsed.course && <p>Course: {parsed.course}</p>}
          </div>
        )
      }
    } catch {
      // Not JSON — show as plain text
    }
    return <p className="text-xs text-muted-foreground mt-1">{notes}</p>
  }

  // Calculate totals
  const totalSelectedQuantity = useMemo(() => {
    return Object.values(returnQuantities).reduce((sum, qty) => sum + qty, 0)
  }, [returnQuantities])

  const totalSelectedItems = selectedReturnItems.size

  // Check if return is valid
  const isReturnValid = useMemo(() => {
    if (totalSelectedQuantity === 0) return false
    
    // Validate all quantities are within bounds
    for (const item of availableReturnItems) {
      const qty = returnQuantities[item.id] || 0
      if (qty > item.maxQuantity || qty < 0) {
        return false
      }
    }
    
    return true
  }, [returnQuantities, availableReturnItems, totalSelectedQuantity])

  // Close dropdown when clicking outside (simplified)
  useEffect(() => {
    const handleClickOutside = () => {
      if (isItemDropdownOpen) {
        setIsItemDropdownOpen(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isItemDropdownOpen])

  return (
    <PageShell title="Request History" description="View and manage requests">
      <Button variant="ghost" size="sm" className="mb-1 sm:mb-2" onClick={() => navigate('/inventory')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Inventory
      </Button>

      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="open">Open</option>
          <option value="partially_returned">Partially Returned</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2 sm:space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 sm:h-20" />
          ))}
        </div>
      ) : checkouts && checkouts.length > 0 ? (
        <div className="space-y-2 sm:space-y-3">
          {checkouts.map((txn: any) => {
            const status = statusConfig[txn.status as CheckoutStatus] || { label: 'Unknown', icon: <HelpCircle className="h-3 w-3" />, color: 'bg-gray-100 text-gray-800' }
            const isSelected = selectedCheckoutId === txn.id
            return (
              <Card
                key={txn.id}
                className={cn(
                  isSelected && 'border-primary',
                  'cursor-pointer transition-colors hover:border-muted-foreground/30',
                )}
                onClick={() => {
                  setSelectedCheckoutId(isSelected ? null : txn.id)
                  if (!isSelected) {
                    clearReturnState()
                  }
                }}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Request #{txn.id.slice(0, 8)}</span>
                        <Badge variant="outline" className={cn('text-xs flex items-center gap-1', status.color)}>
                          {status.icon}
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(txn.created_at).toLocaleString()}
                      </p>
                      {txn.checked_out_by_name && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Requested by: {txn.checked_out_by_name}
                        </p>
                      )}
                      {renderNotes(txn.notes)}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      {isAdminOrStaff && canApprove(txn.status) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={(e) => { e.stopPropagation(); approveCheckout.mutate(txn.id); }}
                            disabled={approveCheckout.isPending}
                          >
                            <ThumbsUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={(e) => { e.stopPropagation(); rejectCheckout.mutate(txn.id); }}
                            disabled={rejectCheckout.isPending}
                          >
                            <ThumbsDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {canReturn(txn.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedCheckoutId(isSelected ? null : txn.id)
                            clearReturnState()
                          }}
                        >
                          <RotateCcw className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                          Return
                        </Button>
                      )}
                      {/* Students can cancel their own pending requests; admin/staff can cancel any open/pending */}
                      {(canCancel(txn.status) && (!isAdminOrStaff ? txn.checked_out_by === user?.id : true)) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); cancelCheckout.mutate(txn.id); }}
                          disabled={cancelCheckout.isPending}
                        >
                          <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Checkout Items Summary (read-only) */}
                  {isSelected && checkoutDetail && checkoutDetail.items && (
                    <div className="mt-4 border-t pt-4 space-y-2">
                      <h4 className="text-sm font-semibold">Items</h4>
                      {checkoutDetail.items.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between rounded-lg border p-2 sm:p-3">
                          <div>
                            <p className="text-sm font-medium">{item.item_name}</p>
                            <p className="text-xs text-muted-foreground">Lot: {item.lot_code}</p>
                          </div>
                          <div className="text-right text-sm">
                            <p>Checked out: {item.quantity_out}</p>
                            <p className="text-xs text-muted-foreground">Returned: {item.quantity_returned}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Return Panel */}
                  {isSelected && checkoutDetail && checkoutDetail.items && availableReturnItems.length > 0 && (
                    <div className="mt-4 border-t pt-4 space-y-2 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold">Select items to return</h4>
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Return All Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReturnAll}
                            className={returnMode === 'all' ? 'bg-primary/10 border-primary text-primary' : ''}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Return All
                          </Button>
                          
                          {/* Specific Return Dropdown */}
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsItemDropdownOpen(!isItemDropdownOpen)}
                              className="flex items-center gap-1"
                            >
                              <ListFilter className="h-3 w-3" />
                              Select Items
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                            
                            {isItemDropdownOpen && (
                              <div className="absolute right-0 mt-1 z-10 w-56 bg-background border rounded-md shadow-lg">
                                <div className="p-2 max-h-64 overflow-y-auto">
                                  <div className="text-xs font-medium text-muted-foreground mb-2 px-1">
                                    Select items to return
                                  </div>
                                  {availableReturnItems.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                                      onClick={() => handleToggleItem(item.id)}
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">{item.itemName}</p>
                                        <p className="text-xs text-muted-foreground">Lot: {item.lotCode}</p>
                                        <p className="text-xs text-muted-foreground">
                                          Available: {item.maxQuantity}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                          {returnQuantities[item.id] || 0}
                                        </span>
                                        {selectedReturnItems.has(item.id) ? (
                                          <Check className="h-4 w-4 text-primary" />
                                        ) : (
                                          <div className="h-4 w-4 border rounded" />
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Selected Items Summary */}
                      {totalSelectedItems > 0 && (
                        <div className="bg-muted/30 rounded-md p-2 sm:p-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div>
                              <p className="text-xs font-medium">
                                {returnMode === 'all' ? 'All items selected' : `${totalSelectedItems} item${totalSelectedItems !== 1 ? 's' : ''} selected`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Total quantity: {totalSelectedQuantity} unit{totalSelectedQuantity !== 1 ? 's' : ''}
                              </p>
                            </div>
                            {returnMode === 'specific' && totalSelectedItems > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-6"
                                onClick={() => {
                                  const newQuantities: Record<string, number> = {}
                                  availableReturnItems.forEach(item => {
                                    if (selectedReturnItems.has(item.id)) {
                                      newQuantities[item.id] = item.maxQuantity
                                    }
                                  })
                                  setReturnQuantities(newQuantities)
                                }}
                              >
                                Set all to max
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Return Items List */}
                      <div className="space-y-2">
                        {availableReturnItems.map((item) => {
                          const isSelectedItem = selectedReturnItems.has(item.id)
                          const quantity = returnQuantities[item.id] || 0
                          
                          return (
                            <div
                              key={item.id}
                              className={cn(
                                "flex items-center justify-between rounded-lg border p-2 sm:p-3 transition-all",
                                isSelectedItem 
                                  ? "border-primary bg-primary/5" 
                                  : "opacity-70 bg-muted/20"
                              )}
                              onClick={() => handleToggleItem(item.id)}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelectedItem}
                                    onChange={() => handleToggleItem(item.id)}
                                    className="h-4 w-4 rounded border-gray-300"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{item.itemName}</p>
                                    <p className="text-xs text-muted-foreground">Lot: {item.lotCode}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Checked out: {item.checkedOut} · Returned: {item.alreadyReturned} · Remaining: {item.maxQuantity}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div 
                                className="flex items-center gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="relative">
                                  <input
                                    type="number"
                                    min={0}
                                    max={item.maxQuantity}
                                    value={quantity}
                                    onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                                    onFocus={(e) => e.target.select()}
                                    className={cn(
                                      "w-14 h-7 sm:w-16 sm:h-8 rounded-md border bg-background px-1 sm:px-2 text-xs sm:text-sm text-center transition-colors",
                                      isSelectedItem
                                        ? "border-primary focus:ring-1 focus:ring-primary"
                                        : "border-input opacity-50"
                                    )}
                                    disabled={!isSelectedItem}
                                  />
                                  {isSelectedItem && quantity > item.maxQuantity && (
                                    <div className="absolute -bottom-5 left-0 right-0">
                                      <p className="text-xs text-destructive text-center">
                                        Max: {item.maxQuantity}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Validation Message */}
                      {!isReturnValid && totalSelectedQuantity > 0 && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-2">
                          <p className="text-xs text-destructive">
                            Some quantities exceed available amounts. Please adjust.
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-1 sm:gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedCheckoutId(null);
                            clearReturnState();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleReturn(txn.id); }}
                          disabled={returnCheckout.isPending || !isReturnValid || totalSelectedQuantity === 0}
                          className="min-w-28"
                        >
                          {returnCheckout.isPending ? (
                            <>
                              <Clock className="h-3 w-3 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            `Return (${totalSelectedQuantity})`
                          )}
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
        <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-muted-foreground">
          <Package className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 opacity-50" />
          <p className="text-base sm:text-lg font-medium">No requests found</p>
        </div>
      )}
    </PageShell>
  )
}