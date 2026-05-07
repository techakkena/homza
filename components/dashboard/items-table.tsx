'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ItemWithDetails } from '@/src/lib/queries';
import { deleteItemAction } from '@/src/lib/actions';
import { useLanguage } from '@/lib/i18n/language-context';

type Category = { id: number; name: string };

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

function stockStatus(qty: number, t: { outOfStock: string; critical: string; low: string; ok: string }) {
  if (qty === 0) return { label: t.outOfStock, variant: 'destructive' as const, rowClass: 'bg-red-50' };
  if (qty <= 5) return { label: t.critical, variant: 'destructive' as const, rowClass: 'bg-red-50' };
  if (qty <= 10) return { label: t.low, variant: 'warning' as const, rowClass: 'bg-amber-50' };
  return { label: t.ok, variant: 'success' as const, rowClass: '' };
}

export function ItemsTable({
  initialItems,
  categories,
}: {
  initialItems: ItemWithDetails[];
  categories: Category[];
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const items = initialItems
    .filter(i => {
      const matchSearch = search
        ? i.name.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchCat =
        categoryFilter === 'all' ? true : String(i.categoryId) === categoryFilter;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === 'stock') return parseFloat(a.stockQty) - parseFloat(b.stockQty);
      if (sortBy === 'price') return parseFloat(b.price) - parseFloat(a.price);
      if (sortBy === 'last')
        return (b.lastPurchasedAt?.getTime() ?? 0) - (a.lastPurchasedAt?.getTime() ?? 0);
      return a.name.localeCompare(b.name);
    });

  const handleDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteItemAction(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder={t.common.search}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t.common.allCategories} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.common.allCategories}</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">{t.common.sortName}</SelectItem>
            <SelectItem value="stock">{t.common.sortStock}</SelectItem>
            <SelectItem value="price">{t.common.sortPrice}</SelectItem>
            <SelectItem value="last">{t.common.sortLastPurchase}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.common.colItem}</TableHead>
              <TableHead>{t.common.colCategory}</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  {t.common.colStock} <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>{t.common.colPrice}</TableHead>
              <TableHead>{t.common.colValue}</TableHead>
              <TableHead>{t.common.colLastPurchase}</TableHead>
              <TableHead>{t.common.colStatus}</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  {t.common.noItemsFound}
                </TableCell>
              </TableRow>
            ) : (
              items.map(item => {
                const qty = parseFloat(item.stockQty);
                const status = stockStatus(qty, t.common);
                return (
                  <TableRow key={item.id} className={cn(status.rowClass)}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.category ?? '—'}
                    </TableCell>
                    <TableCell>
                      {qty} {item.unit}
                    </TableCell>
                    <TableCell>{fmt(parseFloat(item.price))}</TableCell>
                    <TableCell>{fmt(item.totalValue)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.lastPurchasedAt
                        ? formatDistanceToNow(new Date(item.lastPurchasedAt), { addSuffix: true })
                        : t.common.never}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => router.push(`/items?edit=${item.id}`)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirm */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.common.deleteItem}</DialogTitle>
            <DialogDescription>{t.common.deleteItemDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
