'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp } from 'lucide-react';

type MonthlyData = { month: string; total: number };
type CategoryData = { category: string; total: number };
type TopItem = { itemId: number; name: string; unit: string; total: number; purchases: number };
type LowUsageItem = { id: number; name: string; unit: string; stockQty: string };

const COLORS = ['#0D9488', '#22C55E', '#2563EB', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export function InsightsDashboard({
  monthly,
  categories,
  topItems,
  lowUsage,
}: {
  monthly: MonthlyData[];
  categories: CategoryData[];
  topItems: TopItem[];
  lowUsage: LowUsageItem[];
}) {
  return (
    <div className="space-y-6">
      {/* Top / Low usage cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Most Purchased Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
            ) : (
              topItems.map((item, i) => (
                <div key={item.itemId} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium text-primary">{fmt(item.total)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber-500" />
              Consider Not Buying (Low Usage)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowUsage.length === 0 ? (
              <p className="text-sm text-muted-foreground">All items are actively purchased</p>
            ) : (
              lowUsage.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {parseFloat(item.stockQty)} {item.unit} in stock
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Monthly Spending (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          {monthly.every(m => m.total === 0) ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No purchases recorded yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                <Tooltip
                  formatter={(v) => [fmt(Number(v) || 0), 'Spend']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="total" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Category pie */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="total"
                  nameKey="category"
                  label={({ percent }: { percent?: number }) =>
                    percent ? `${(percent * 100).toFixed(0)}%` : ''
                  }
                  labelLine={false}
                >
                  {categories.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmt(Number(v) || 0)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
