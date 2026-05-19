import React, { useState, useMemo } from 'react';
import { AlertTriangle, Clock, Package, CheckCircle, TrendingUp, Calendar, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select } from '@/components/ui/select';
import { Item, ItemLot } from '@/types/inventory';

interface ExpirationKPICardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  variant: 'default' | 'destructive' | 'warning' | 'success';
  trend?: number;
}

function ExpirationKPICard({ title, value, description, icon, variant, trend }: ExpirationKPICardProps) {
  const variantClasses = {
    default: 'border-gray-200 bg-gray-50',
    destructive: 'border-red-200 bg-red-50',
    warning: 'border-orange-200 bg-orange-50',
    success: 'border-green-200 bg-green-50',
  };

  const badgeVariants = {
    default: 'secondary',
    destructive: 'destructive',
    warning: 'warning',
    success: 'success',
  } as const;

  return (
    <Card className={`${variantClasses[variant]} transition-all hover:shadow-md`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-white p-1.5 flex items-center justify-center shadow-sm">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend !== undefined && (
            <Badge variant={badgeVariants[variant]} className="text-xs">
              {trend > 0 ? '+' : ''}{trend}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export interface InventoryItemWithExpiration extends Item {
  lots?: ItemLot[];
  totalQuantity?: number;
}

interface InventoryExpirationKPIsProps {
  items?: InventoryItemWithExpiration[];
  isLoading?: boolean;
  configurableThresholds?: number[];
  onFilterChange?: (filter: 'expired' | 'near-expiry' | 'safe' | 'all', days?: number) => void;
}

export function InventoryExpirationKPIs({
  items = [],
  isLoading = false,
  configurableThresholds = [7, 14, 30],
  onFilterChange,
}: InventoryExpirationKPIsProps) {
  const [selectedThreshold, setSelectedThreshold] = useState<number>(configurableThresholds[0]);
  const [activeFilter, setActiveFilter] = useState<'expired' | 'near-expiry' | 'safe' | 'all'>('all');

  // Calculate expiration statistics based on lots
  const expirationStats = useMemo(() => {
    if (!items.length) {
      return {
        expired: 0,
        nearExpiry: 0,
        safe: 0,
        total: 0,
        expirationRate: 0,
        criticalItems: [] as InventoryItemWithExpiration[],
      };
    }

    const now = new Date();
    let expiredCount = 0;
    let nearExpiryCount = 0;
    let safeCount = 0;
    const criticalItems: InventoryItemWithExpiration[] = [];

    items.forEach(item => {
      const lots = item.lots || [];
      let itemExpired = false;
      let itemNearExpiry = false;
      let itemCritical = false;

      // Check each lot for expiration
      lots.forEach(lot => {
        if (!lot.expires_at) return;
        
        const expDate = new Date(lot.expires_at);
        const diffTime = expDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
          itemExpired = true;
          if (diffDays <= 3) itemCritical = true;
        } else if (diffDays <= selectedThreshold) {
          itemNearExpiry = true;
          if (diffDays <= 3) itemCritical = true;
        }
      });

      // Count based on worst status of any lot
      if (itemExpired) {
        expiredCount++;
      } else if (itemNearExpiry) {
        nearExpiryCount++;
      } else {
        safeCount++;
      }

      if (itemCritical) {
        criticalItems.push(item);
      }
    });

    const total = expiredCount + nearExpiryCount + safeCount;
    const expirationRate = total > 0 
      ? Math.round(((expiredCount + nearExpiryCount) / total) * 100)
      : 0;

    return {
      expired: expiredCount,
      nearExpiry: nearExpiryCount,
      safe: safeCount,
      total,
      expirationRate,
      criticalItems,
    };
  }, [items, selectedThreshold]);

  const handleFilterChange = (filter: 'expired' | 'near-expiry' | 'safe' | 'all') => {
    setActiveFilter(filter);
    if (onFilterChange) {
      onFilterChange(filter, selectedThreshold);
    }
  };

  const handleThresholdChange = (days: number) => {
    setSelectedThreshold(days);
    if (onFilterChange && activeFilter === 'near-expiry') {
      onFilterChange('near-expiry', days);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with configuration */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventory Expiration Monitoring</h2>
          <p className="text-muted-foreground">
            Track expiration status, set alerts, and manage inventory health
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Threshold:</span>
            <Select value={selectedThreshold.toString()} onChange={(e) => handleThresholdChange(parseInt(e.target.value))}>
              {configurableThresholds.map(days => (
                <option key={days} value={days.toString()}>
                  {days} days
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ExpirationKPICard
          title="Expired Items"
          value={expirationStats.expired}
          description="Items past expiration date"
          icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
          variant="destructive"
          trend={expirationStats.total > 0 ? Math.round((expirationStats.expired / expirationStats.total) * 100) : 0}
        />
        
        <ExpirationKPICard
          title="Expiring Soon"
          value={expirationStats.nearExpiry}
          description={`Within ${selectedThreshold} days`}
          icon={<Clock className="h-4 w-4 text-orange-600" />}
          variant="warning"
          trend={expirationStats.total > 0 ? Math.round((expirationStats.nearExpiry / expirationStats.total) * 100) : 0}
        />
        
        <ExpirationKPICard
          title="Healthy Inventory"
          value={expirationStats.safe}
          description="Safe from expiration"
          icon={<CheckCircle className="h-4 w-4 text-green-600" />}
          variant="success"
          trend={expirationStats.total > 0 ? Math.round((expirationStats.safe / expirationStats.total) * 100) : 0}
        />
        
        <ExpirationKPICard
          title="Expiration Rate"
          value={expirationStats.expirationRate}
          description="% of inventory at risk"
          icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
          variant="default"
        />
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeFilter} onValueChange={(value) => handleFilterChange(value as any)}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            All Items ({expirationStats.total})
          </TabsTrigger>
          <TabsTrigger value="expired" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Expired ({expirationStats.expired})
          </TabsTrigger>
          <TabsTrigger value="near-expiry" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Near Expiry ({expirationStats.nearExpiry})
          </TabsTrigger>
          <TabsTrigger value="safe" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Safe ({expirationStats.safe})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Inventory Items</CardTitle>
              <CardDescription>
                {expirationStats.total} total items • {expirationStats.expirationRate}% at risk of expiration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={expirationStats.expirationRate} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>Healthy: {expirationStats.safe}</span>
                <span>At Risk: {expirationStats.expired + expirationStats.nearExpiry}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="expired" className="mt-4">
          <Card className="border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Expired Items Requiring Attention
              </CardTitle>
              <CardDescription>
                {expirationStats.expired} items past their expiration date
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expirationStats.expired > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm">These items should be removed from circulation or disposed of according to policy.</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">CRITICAL</Badge>
                    <span className="text-sm">Immediate action required</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                  <p className="font-medium">No expired items found</p>
                  <p className="text-sm">All inventory items are within their valid dates.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Critical Alerts */}
      {expirationStats.criticalItems.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Critical Expiration Alerts ({expirationStats.criticalItems.length})
            </CardTitle>
            <CardDescription>
              Items expiring within 3 days or already expired
            </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="space-y-3">
                {expirationStats.criticalItems.slice(0, 5).map((item, index) => {
                  // Find the most critical lot for this item
                  const now = new Date();
                  const criticalLots = (item.lots || []).filter(lot => {
                    if (!lot.expires_at) return false;
                    const expDate = new Date(lot.expires_at);
                    const diffTime = expDate.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 3;
                  });

                  if (criticalLots.length === 0) return null;
                  
                  const worstLot = criticalLots[0]; // Take first critical lot
                  const expDate = new Date(worstLot.expires_at!);
                  const diffTime = expDate.getTime() - now.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={item.id || index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Lot: {worstLot.lot_code || 'N/A'} • Qty: {worstLot.quantity_on_hand}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={diffDays <= 0 ? "destructive" : "warning"}>
                          {diffDays <= 0 ? 'EXPIRED' : `Expires in ${diffDays} days`}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {expDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                }).filter(Boolean)}
                
                {expirationStats.criticalItems.length > 5 && (
                  <p className="text-sm text-center text-muted-foreground">
                    + {expirationStats.criticalItems.length - 5} more critical items
                  </p>
                )}
              </div>
            </CardContent>
        </Card>
      )}

      {/* Configuration Help */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Expiration Monitoring Configuration</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="font-medium mb-1">Expired Items</p>
              <p className="text-muted-foreground">Items past their expiration date (red indicator)</p>
            </div>
            <div>
              <p className="font-medium mb-1">Near Expiry</p>
              <p className="text-muted-foreground">Items expiring within selected threshold (orange/yellow indicator)</p>
            </div>
            <div>
              <p className="font-medium mb-1">Healthy Inventory</p>
              <p className="text-muted-foreground">Items not near expiration (green indicator)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}