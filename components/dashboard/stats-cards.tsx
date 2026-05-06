import { Package, IndianRupee, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type Stats = {
  totalItems: number;
  totalSpend: number;
  lowStockItems: number;
  thisMonthSpend: number;
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export function StatsCards({ stats }: { stats: Stats }) {
  const cards = [
    {
      label: 'Total Items',
      value: String(stats.totalItems),
      icon: Package,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Total Spend',
      value: fmt(stats.totalSpend),
      icon: IndianRupee,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Low Stock',
      value: String(stats.lowStockItems),
      icon: AlertTriangle,
      color: stats.lowStockItems > 0 ? 'text-amber-600' : 'text-muted-foreground',
      bg: stats.lowStockItems > 0 ? 'bg-amber-50' : 'bg-muted/30',
    },
    {
      label: 'This Month',
      value: fmt(stats.thisMonthSpend),
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(card => (
        <Card key={card.label}>
          <CardContent className="flex items-center gap-4 p-5">
            <div className={`rounded-lg p-2.5 ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="text-xl font-bold leading-none mt-1">{card.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
