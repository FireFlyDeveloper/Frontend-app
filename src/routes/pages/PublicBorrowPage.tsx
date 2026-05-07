import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart,
  ArrowLeft,
  Plus,
  Package,
  User,
  CheckCircle,
  Mail,
  BookOpen,
  Hash,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery, useMutation } from '@tanstack/react-query'
import { inventoryApi } from '@/api/inventory'
import { useUIStore } from '@/stores/uiStore'
import { ItemLot, Item } from '@/types/inventory'

// ── Sub-components ─────────────────────────────────────────────────

interface CartItem {
  lot: ItemLot
  quantity: number
}

function ItemRow({
  item,
  cart,
  onAddToCart,
}: {
  item: Item
  cart: CartItem[]
  onAddToCart: (item: Item, lots: ItemLot[], qty: number) => void
}) {
  const { data: lots, isLoading } = useQuery({
    queryKey: ['public-lots', item.id],
    queryFn: () =>
      inventoryApi.getPublicLots(item.id).then((res) => res.data.lots),
    staleTime: 60 * 1000,
  })

  const [qty, setQty] = useState(1)
  const availableLots = lots?.filter((l) => l.quantity_on_hand > 0) ?? []
  const totalAvailable = availableLots.reduce((s, l) => s + l.quantity_on_hand, 0)

  // Count how many of this item are already in cart
  const itemLotIds = new Set(lots?.map((l) => l.id) ?? [])
  const inCartQty = cart
    .filter((c) => itemLotIds.has(c.lot.id))
    .reduce((s, c) => s + c.quantity, 0)
  const remaining = totalAvailable - inCartQty

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Package className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{item.name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {item.sku && <span className="font-mono text-primary">{item.sku}</span>}
              {isLoading ? (
                <span>Loading stock...</span>
              ) : (
                <span>Available: <strong>{remaining}</strong></span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Input
            type="number"
            min={1}
            max={Math.max(0, remaining)}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(remaining, parseInt(e.target.value) || 1)))}
            className="w-16 h-8 text-center"
            disabled={remaining <= 0 || isLoading}
          />
          <Button
            size="sm"
            className="h-8 shrink-0"
            disabled={remaining <= 0 || isLoading || qty < 1}
            onClick={() => {
              if (lots) {
                onAddToCart(item, lots, qty)
                setQty(1)
              }
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Student info form ──────────────────────────────────────────────

interface StudentInfo {
  srcode: string
  email: string
  name: string
  course: string
}

function StudentInfoForm({
  value,
  onChange,
}: {
  value: StudentInfo
  onChange: (v: StudentInfo) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
          Student ID (SR-Code)
        </label>
        <Input
          placeholder="e.g. SR-2024-00001"
          value={value.srcode}
          onChange={(e) => onChange({ ...value, srcode: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          Email
        </label>
        <Input
          type="email"
          placeholder="student@school.edu"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          Full Name
        </label>
        <Input
          placeholder="Juan Dela Cruz"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
          Course / Program
        </label>
        <Input
          placeholder="e.g. BS Computer Science"
          value={value.course}
          onChange={(e) => onChange({ ...value, course: e.target.value })}
        />
      </div>
    </div>
  )
}

// ── Main page component ────────────────────────────────────────────

type Step = 'browse' | 'info' | 'review'

export function PublicBorrowPage() {
  const navigate = useNavigate()
  const addToast = useUIStore((state) => state.addToast)

  const [step, setStep] = useState<Step>('browse')
  const [itemSearch, setItemSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    srcode: '',
    email: '',
    name: '',
    course: '',
  })

  // Fetch quantifiable items via public endpoint
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['public-items', itemSearch],
    queryFn: () =>
      inventoryApi
        .getPublicItems({ search: itemSearch || undefined })
        .then((res) => res.data.items),
    staleTime: 60 * 1000,
  })

  const addToCart = useCallback(
    (item: Item, lots: ItemLot[], qty: number) => {
      const available = lots.filter((l) => l.quantity_on_hand > 0)
      if (available.length === 0) return

      // Distribute qty across available lots
      let remaining = qty
      const additions: { lot: ItemLot; quantity: number }[] = []

      for (const lot of available) {
        if (remaining <= 0) break
        const take = Math.min(remaining, lot.quantity_on_hand)
        additions.push({ lot, quantity: take })
        remaining -= take
      }

      if (remaining > 0) {
        addToast({ message: `Only ${qty - remaining} of ${qty} available for ${item.name}`, type: 'warning' })
      }

      setCart((prev) => {
        const next = [...prev]
        for (const add of additions) {
          const existing = next.find((c) => c.lot.id === add.lot.id)
          if (existing) {
            existing.quantity += add.quantity
          } else {
            next.push(add)
          }
        }
        return next
      })
      addToast({ message: `Added ${item.name} (×${qty})`, type: 'success' })
    },
    [addToast]
  )

  const updateQuantity = useCallback((lotId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((c) => (c.lot.id === lotId ? { ...c, quantity } : c))
    )
  }, [])

  const removeFromCart = useCallback((lotId: string) => {
    setCart((prev) => prev.filter((c) => c.lot.id !== lotId))
  }, [])

  const borrowMutation = useMutation({
    mutationFn: () =>
      inventoryApi.publicBorrow({
        srcode: studentInfo.srcode,
        email: studentInfo.email,
        name: studentInfo.name,
        course: studentInfo.course,
        lines: cart.map((c) => ({ lot_id: c.lot.id, quantity: c.quantity })),
      }),
    onSuccess: () => {
      addToast({
        message: 'Borrow request submitted for approval!',
        type: 'success',
      })
      setCart([])
      setStep('browse')
      setStudentInfo({ srcode: '', email: '', name: '', course: '' })
    },
    onError: (err: any) => {
      addToast({
        message: err?.response?.data?.error || 'Failed to submit request',
        type: 'error',
      })
    },
  })

  // ── Step indicator ─────────────────────────────────────────────

  const stepIndicator = (
    <div className="flex items-center gap-2 mb-6 text-sm">
      {(['browse', 'info', 'review'] as const).map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
              step === s
                ? 'bg-primary text-primary-foreground'
                : ['browse', 'info', 'review'].indexOf(step) > i
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {['browse', 'info', 'review'].indexOf(step) > i ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              i + 1
            )}
          </div>
          <span
            className={
              step === s ? 'font-medium' : 'text-muted-foreground'
            }
          >
            {s === 'browse'
              ? 'Browse Items'
              : s === 'info'
                ? 'Your Info'
                : 'Review & Submit'}
          </span>
          {i < 2 && <span className="text-muted-foreground mx-1">→</span>}
        </div>
      ))}
    </div>
  )

  // ── Step 1: Browse ─────────────────────────────────────────────

  if (step === 'browse') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">
              Student Borrow Request
            </h1>
            <p className="text-muted-foreground mt-1">
              Browse available items and add them to your request cart
            </p>
          </div>

          {stepIndicator}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Available Items</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <Input
                    placeholder="Search items..."
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                  />

                  {itemsLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-12" />
                      ))}
                    </div>
                  ) : items && items.length > 0 ? (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                      {items.map((item) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          cart={cart}
                          onAddToCart={addToCart}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No items available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Cart ({cart.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Add items from the list to get started
                    </p>
                  ) : (
                    <>
                      {cart.map((c) => (
                        <div
                          key={c.lot.id}
                          className="flex items-center gap-2 rounded-lg border p-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {c.lot.lot_code}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {c.quantity}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => removeFromCart(c.lot.id)}
                          >
                            <span className="text-xs">✕</span>
                          </Button>
                        </div>
                      ))}

                      <Button
                        className="w-full"
                        onClick={() => setStep('info')}
                        disabled={cart.length === 0}
                      >
                        Proceed to Info
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 2: Student Info ───────────────────────────────────────

  if (step === 'info') {
    const isInfoValid =
      studentInfo.srcode.trim() &&
      studentInfo.email.trim() &&
      studentInfo.name.trim() &&
      studentInfo.course.trim()

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => setStep('browse')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Items
          </Button>

          <h1 className="text-2xl font-bold tracking-tight mb-1">
            Your Information
          </h1>
          <p className="text-muted-foreground mb-6">
            Provide your student details so staff can process your request
          </p>

          {stepIndicator}

          <Card>
            <CardContent className="pt-6">
              <StudentInfoForm
                value={studentInfo}
                onChange={setStudentInfo}
              />
            </CardContent>
          </Card>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep('browse')}>
              Back
            </Button>
            <Button
              onClick={() => setStep('review')}
              disabled={!isInfoValid}
            >
              Review Request
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 3: Review & Submit ────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => setStep('info')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Info
        </Button>

        <h1 className="text-2xl font-bold tracking-tight mb-1">
          Review & Submit
        </h1>
        <p className="text-muted-foreground mb-6">
          Please double-check your information before submitting
        </p>

        {stepIndicator}

        <div className="space-y-6">
          {/* Student Info Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Student Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">SR-Code</span>
                <span className="font-medium">{studentInfo.srcode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{studentInfo.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{studentInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Course</span>
                <span className="font-medium">{studentInfo.course}</span>
              </div>
            </CardContent>
          </Card>

          {/* Items Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Items ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {cart.map((c) => (
                <div
                  key={c.lot.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{c.lot.lot_code}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {c.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            className="w-full"
            size="lg"
            disabled={borrowMutation.isPending}
            onClick={() => borrowMutation.mutate()}
          >
            {borrowMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Borrow Request'
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Your request will be submitted for staff approval.
            You may use the same SR-Code and email to track your requests.
          </p>
        </div>
      </div>
    </div>
  )
}
