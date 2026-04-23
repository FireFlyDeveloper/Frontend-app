import { Package, Box, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Item } from '@/types/inventory'
import { cn } from '@/lib/utils'

interface ItemCardProps {
  item: Item
  onClick?: () => void
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-shadow hover:shadow-md',
        onClick && 'hover:border-primary'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 rounded-lg bg-primary/10 p-2">
              {item.item_type === 'quantifiable' ? (
                <Box className="h-5 w-5 text-primary" />
              ) : (
                <Package className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-medium truncate">{item.name}</h3>
              {item.category && (
                <p className="text-xs text-muted-foreground truncate">{item.category}</p>
              )}
            </div>
          </div>
          <Badge variant="outline" className={cn('shrink-0 text-xs', statusColors[item.status])}>
            {item.status}
          </Badge>
        </div>
        {item.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
        )}
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="capitalize">{item.item_type}</span>
          {item.status === 'maintenance' && <AlertTriangle className="h-3 w-3 text-yellow-600" />}
        </div>
      </CardContent>
    </Card>
  )
}
