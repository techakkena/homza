'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, TrendingDown, Scale, IndianRupee } from 'lucide-react';
import type { BalanceReportRow } from '@/src/lib/queries';
import { useLanguage } from '@/lib/i18n/language-context';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

function StockBadge({ qty, t }: { qty: number; unit: string; t: { outOfStock: string; critical: string; low: string; good: string } }) {
  if (qty === 0) return <Badge variant="destructive">{t.outOfStock}</Badge>;
  if (qty <= 5) return <Badge variant="destructive">{t.critical}</Badge>;
  if (qty <= 20) return <Badge variant="warning">{t.low}</Badge>;
  return <Badge variant="success">{t.good}</Badge>;
}

export function ConsumptionBalanceReport({ rows }: { rows: BalanceReportRow[] }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = Array.from(new Set(rows.map(r => r.category))).sort();

  const filtered = rows.filter(r => {
    const matchSearch = search ? r.name.toLowerCase().includes(search.toLowerCase()) : true;
    const matchCat = categoryFilter === 'all' ? true : r.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const totalPurchased = filtered.reduce((s, r) => s + r.purchasedAmount, 0);
  const totalBalanceValue = filtered.reduce((s, r) => s + r.balanceValue, 0);
  const consumedValue = totalPurchased - totalBalanceValue;

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <Scale className="h-10 w-10 mx-auto mb-3 opacity-20" />
        <p className="font-medium">{t.reports.noBalance}</p>
        <p className="text-sm mt-1">{t.reports.noBalanceDesc}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-blue-100 bg-blue-50/50">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-blue-700 flex items-center gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5" /> {t.reports.totalPurchased}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <p className="text-xl font-bold text-blue-900">{fmt(totalPurchased)}</p>
          </CardContent>
        </Card>

        <Card className="border-orange-100 bg-orange-50/50">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-orange-700 flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5" /> {t.reports.consumedValue}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <p className="text-xl font-bold text-orange-900">{fmt(Math.max(0, consumedValue))}</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/50">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5" /> {t.reports.balanceValue}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <p className="text-xl font-bold text-emerald-900">{fmt(totalBalanceValue)}</p>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-purple-50/50">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-purple-700 flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5" /> {t.reports.itemsTracked}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <p className="text-xl font-bold text-purple-900">{filtered.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder={t.reports.searchItems}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t.reports.allCategories} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.reports.allCategories}</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Balance table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs">{t.reports.colItem}</TableHead>
              <TableHead className="text-xs">{t.reports.colCategory}</TableHead>
              <TableHead className="text-xs text-right">{t.reports.colPurchasedQty}</TableHead>
              <TableHead className="text-xs text-right">{t.reports.colPurchasedAmt}</TableHead>
              <TableHead className="text-xs text-right">{t.reports.colConsumedQty}</TableHead>
              <TableHead className="text-xs text-right">{t.reports.colBalanceQty}</TableHead>
              <TableHead className="text-xs text-right">{t.reports.colBalanceValue}</TableHead>
              <TableHead className="text-xs">{t.reports.colStatus}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  {t.reports.noItemsMatch}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(row => (
                <TableRow key={row.id} className="hover:bg-muted/10 text-sm">
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{row.category}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {row.purchasedQty.toFixed(2)} {row.unit}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fmt(row.purchasedAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.consumedQty > 0 ? (
                      <span className="text-orange-600 font-medium">
                        {row.consumedQty.toFixed(2)} {row.unit}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {row.balanceQty.toFixed(2)} {row.unit}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-700">
                    {fmt(row.balanceValue)}
                  </TableCell>
                  <TableCell>
                    <StockBadge qty={row.balanceQty} unit={row.unit} t={t.common} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
