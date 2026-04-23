import { useState } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { InventoryMovementReport } from './InventoryMovementReport'
import { CheckoutHistoryReport } from './CheckoutHistoryReport'
import { MissingItemsReport } from './MissingItemsReport'
import { DeviceHealthReport } from './DeviceHealthReport'
import { BarChart3, ShoppingCart, AlertTriangle, Radio } from 'lucide-react'

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState('inventory-movement')

  return (
    <PageShell
      title="Reports"
      description="Generate and export system reports"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="inventory-movement">
            <BarChart3 className="h-4 w-4 mr-2" />
            Inventory Movement
          </TabsTrigger>
          <TabsTrigger value="checkout-history">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Checkout History
          </TabsTrigger>
          <TabsTrigger value="missing-items">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Missing Items
          </TabsTrigger>
          <TabsTrigger value="device-health">
            <Radio className="h-4 w-4 mr-2" />
            Device Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory-movement">
          <InventoryMovementReport />
        </TabsContent>
        <TabsContent value="checkout-history">
          <CheckoutHistoryReport />
        </TabsContent>
        <TabsContent value="missing-items">
          <MissingItemsReport />
        </TabsContent>
        <TabsContent value="device-health">
          <DeviceHealthReport />
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
