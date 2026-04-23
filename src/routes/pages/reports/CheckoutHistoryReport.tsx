import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useCheckoutHistoryReport } from '@/hooks/useReports'
import { exportToCSV, exportToJSON } from '@/lib/export'
import { FileDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  partially_returned: 'bg-amber-100 text-amber-800',
  closed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

export function CheckoutHistoryReport() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const filters = {
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  }

  const { data, isLoading } = useCheckoutHistoryReport(filters)

  const handleExportCSV = () => {
    if (!data) return
    exportToCSV(
      data.map((d) => ({
        id: d.id,
        checkedOutBy: d.checkedOutBy,
        processedBy: d.processedBy || '',
        status: d.status,
        itemCount: d.itemCount,
        notes: d.notes || '',
        createdAt: d.createdAt,
      })),
      `checkout-history-${new Date().toISOString().split('T')[0]}.csv`,
      {
        id: 'ID',
        checkedOutBy: 'Checked Out By',
        processedBy: 'Processed By',
        status: 'Status',
        itemCount: 'Items',
        notes: 'Notes',
        createdAt: 'Date',
      }
    )
  }

  const handleExportJSON = () => {
    if (!data) return
    exportToJSON(data, `checkout-history-${new Date().toISOString().split('T')[0]}.json`)
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
          <CardTitle className="text-base">Checkout Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">ID</th>
                <th className="text-left px-4 py-3 font-medium">Checked Out By</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Items</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                  </tr>
                ))
              ) : data && data.length > 0 ? (
                data.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{row.id.slice(0, 8)}...</td>
                    <td className="px-4 py-3">{row.checkedOutBy}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn('text-xs capitalize', statusColors[row.status] || '')}>
                        {row.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{row.itemCount}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No checkout data for selected range</p>
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
