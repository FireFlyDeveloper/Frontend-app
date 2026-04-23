import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, ArrowLeft } from 'lucide-react'
import { PageShell } from '@/components/layout/PageShell'
import { BarcodeScanner } from '@/components/inventory/BarcodeScanner'
import { CheckoutCart, CartItem } from '@/components/inventory/CheckoutCart'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { useScanCode, useCreateCheckout } from '@/hooks/useCheckout'
import { useUIStore } from '@/stores/uiStore'
import { ItemLot } from '@/types/inventory'

export function CheckoutPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const addToast = useUIStore((state) => state.addToast)
  const canCheckout = user?.roles?.includes('admin') || user?.roles?.includes('staff')

  const [cart, setCart] = useState<CartItem[]>([])

  const scanCode = useScanCode()
  const createCheckout = useCreateCheckout()

  const handleScan = useCallback(
    (code: string) => {
      scanCode.mutate(code, {
        onSuccess: (result) => {
          if (result.type === 'lot' && result.lot) {
            const lot = result.lot as ItemLot
            if (lot.quantity_on_hand <= 0) {
              addToast({ message: 'This lot is out of stock', type: 'warning' })
              return
            }
            setCart((prev) => {
              const existing = prev.find((c) => c.lot.id === lot.id)
              if (existing) {
                if (existing.quantity >= lot.quantity_on_hand) {
                  addToast({ message: 'Maximum available quantity reached', type: 'warning' })
                  return prev
                }
                return prev.map((c) =>
                  c.lot.id === lot.id ? { ...c, quantity: c.quantity + 1 } : c
                )
              }
              return [...prev, { lot, quantity: 1 }]
            })
            addToast({ message: `Added ${lot.lot_code}`, type: 'success' })
          } else if (result.type === 'item' && result.item) {
            addToast({ message: `Scanned item: ${result.item.name}. Please scan a lot code to checkout.`, type: 'info' })
          }
        },
      })
    },
    [scanCode, addToast]
  )

  const handleUpdateQuantity = useCallback((lotId: string, quantity: number) => {
    setCart((prev) => prev.map((c) => (c.lot.id === lotId ? { ...c, quantity } : c)))
  }, [])

  const handleRemove = useCallback((lotId: string) => {
    setCart((prev) => prev.filter((c) => c.lot.id !== lotId))
  }, [])

  const handleCheckout = useCallback(
    (notes: string) => {
      if (cart.length === 0) return
      createCheckout.mutate(
        {
          lines: cart.map((c) => ({ lot_id: c.lot.id, quantity: c.quantity })),
          notes: notes || undefined,
        },
        {
          onSuccess: () => {
            setCart([])
            navigate('/inventory/checkouts')
          },
        }
      )
    },
    [cart, createCheckout, navigate]
  )

  if (!canCheckout) {
    return (
      <PageShell title="Checkout">
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">Checkout not available</p>
          <p className="text-sm">You do not have permission to checkout items.</p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell title="Checkout" description="Scan or add items to checkout">
      <Button variant="ghost" size="sm" className="mb-2" onClick={() => navigate('/inventory')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Inventory
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4">
              <BarcodeScanner onScan={handleScan} isLoading={scanCode.isPending} />
            </CardContent>
          </Card>

          {cart.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3">Scanned Items</h3>
                <div className="space-y-2">
                  {cart.map((c) => (
                    <div key={c.lot.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{c.lot.lot_code}</p>
                        <p className="text-xs text-muted-foreground">Qty: {c.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <CheckoutCart
            items={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemove}
            onCheckout={handleCheckout}
            isLoading={createCheckout.isPending}
          />
        </div>
      </div>
    </PageShell>
  )
}
