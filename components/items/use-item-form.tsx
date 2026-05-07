'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { recordConsumptionAction } from '@/src/lib/actions';
import { Package, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

type ItemForConsumption = {
  id: number;
  name: string;
  unit: string;
  price: string;
  stockQty: string;
  category: string | null;
};

export function UseItemForm({ items }: { items: ItemForConsumption[] }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [selectedItemId, setSelectedItemId] = useState('');
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const selectedItem = useMemo(
    () => items.find(i => String(i.id) === selectedItemId),
    [items, selectedItemId]
  );

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, ItemForConsumption[]>();
    for (const item of items) {
      const cat = item.category ?? 'Uncategorized';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    return map;
  }, [items]);

  const stockQty = selectedItem ? parseFloat(selectedItem.stockQty) : 0;
  const consumptionQty = parseFloat(qty) || 0;
  const balanceAfter = stockQty - consumptionQty;

  const reset = () => {
    setSelectedItemId(''); setQty(''); setNotes('');
    setError(''); setSuccessMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccessMsg('');

    if (!selectedItemId || !qty) { setError('Please select an item and enter quantity.'); return; }
    if (consumptionQty <= 0) { setError('Quantity must be greater than 0.'); return; }
    if (consumptionQty > stockQty) {
      setError(`Insufficient stock. Available: ${stockQty} ${selectedItem?.unit}`);
      return;
    }

    startTransition(async () => {
      const result = await recordConsumptionAction({ itemId: parseInt(selectedItemId), qty, notes: notes || undefined });
      if (result.success) {
        setSuccessMsg(`Recorded ${consumptionQty} ${selectedItem?.unit} of ${selectedItem?.name}. ${t.items.balanceAfterUse}: ${balanceAfter.toFixed(3)} ${selectedItem?.unit}`);
        setSelectedItemId(''); setQty(''); setNotes('');
        router.refresh();
      } else {
        setError(result.error ?? 'Failed to record consumption');
      }
    });
  };

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-14 text-center">
          <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="font-medium text-muted-foreground">{t.items.noStock}</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">{t.items.noStockDesc}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div className="space-y-1.5">
        <Label>{t.items.category} *</Label>
        <Select value={selectedItemId} onValueChange={v => { setSelectedItemId(v); setQty(''); setError(''); setSuccessMsg(''); }}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder={t.items.selectItem} />
          </SelectTrigger>
          <SelectContent>
            {Array.from(itemsByCategory.entries()).map(([cat, catItems]) => (
              <SelectGroup key={cat}>
                <SelectLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{cat}</SelectLabel>
                {catItems.map(item => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground ml-1.5 text-xs">— {parseFloat(item.stockQty)} {item.unit}</span>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedItem && (
        <Card className="bg-muted/20 border-muted">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm">{selectedItem.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">₹{parseFloat(selectedItem.price).toLocaleString('en-IN')} / {selectedItem.unit}</p>
              </div>
              <div className="text-right shrink-0">
                {stockQty === 0 ? <Badge variant="destructive">{t.common.outOfStock}</Badge>
                  : stockQty <= 5 ? <Badge variant="destructive">{t.common.critical} — {stockQty} {selectedItem.unit}</Badge>
                  : stockQty <= 20 ? <Badge variant="warning">{t.common.low} — {stockQty} {selectedItem.unit}</Badge>
                  : <Badge variant="success">{t.common.good} — {stockQty} {selectedItem.unit}</Badge>}
                <p className="text-xs text-muted-foreground mt-1">₹{(stockQty * parseFloat(selectedItem.price)).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="consQty">{t.items.consumptionQty}{selectedItem ? ` (${selectedItem.unit})` : ''} *</Label>
        <Input
          id="consQty"
          type="number" step="0.001" min="0.001"
          max={selectedItem?.stockQty}
          value={qty}
          onChange={e => { setQty(e.target.value); setError(''); }}
          placeholder={selectedItem ? `Max: ${stockQty} ${selectedItem.unit}` : t.items.selectItem}
          disabled={!selectedItem}
          required
        />
      </div>

      {selectedItem && qty && consumptionQty > 0 && (
        <div className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-2.5 ${
          balanceAfter < 0 ? 'bg-red-50 border-red-200 text-red-700'
            : balanceAfter <= 5 ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
          {balanceAfter < 0 ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <TrendingDown className="h-4 w-4 shrink-0" />}
          <span>{t.items.balanceAfterUse}: <strong>{Math.max(0, balanceAfter).toFixed(3)} {selectedItem.unit}</strong> (₹{(Math.max(0, balanceAfter) * parseFloat(selectedItem.price)).toLocaleString('en-IN')})</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="consNotes">{t.items.notes} ({t.common.optional})</Label>
        <Textarea id="consNotes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Used for cooking..." rows={2} />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />{successMsg}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={isPending || !selectedItemId || !qty} className="bg-orange-600 hover:bg-orange-700 text-white">
          <TrendingDown className="h-4 w-4 mr-1.5" />
          {isPending ? t.items.recording : t.items.recordBtn}
        </Button>
        <Button type="button" variant="outline" onClick={reset}>{t.common.clear}</Button>
      </div>
    </form>
  );
}
