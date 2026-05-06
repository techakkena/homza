'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart, Plus, Minus, Trash2, CheckCircle2,
  Camera, PenLine, Receipt, X, ScanLine, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { completePurchaseCartAction } from '@/src/lib/actions';
import type { ItemWithDetails } from '@/src/lib/queries';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────

type CartEntry = {
  tempId: string;
  itemId: number | null;   // null for items not yet in DB
  name: string;
  unit: string;
  price: string;
  qty: number;
  custom?: boolean;        // true for scan/manual/bill entries
};

type ExtractedItem = {
  id: string;
  name: string;
  qty: string;
  unit: string;
  price: string;
  selected: boolean;
};

const UNITS = ['kg', 'gram', 'liter', 'ml', 'piece', 'pack', 'box', 'bottle', 'dozen', 'bag'];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Stock item card (inventory list) ──────────────────────────────────────

function ItemCard({ item, onAdd }: { item: ItemWithDetails; onAdd: (item: ItemWithDetails) => void }) {
  const qty = parseFloat(item.stockQty);
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground">
          {qty} {item.unit} in stock · {fmt(parseFloat(item.price))}/{item.unit}
        </p>
      </div>
      <Button size="sm" variant={qty === 0 ? 'outline' : 'default'} onClick={() => onAdd(item)} className="shrink-0 ml-3">
        <Plus className="h-3.5 w-3.5 mr-1" />
        Add
      </Button>
    </div>
  );
}

// ── Manual add form ────────────────────────────────────────────────────────

function ManualAddForm({ onAdd }: { onAdd: (entry: Omit<CartEntry, 'tempId'>) => void }) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('piece');
  const [price, setPrice] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;
    onAdd({ itemId: null, name: name.trim(), unit, price, qty: parseFloat(qty) || 1, custom: true });
    setName(''); setQty('1'); setPrice('');
  };

  return (
    <form onSubmit={submit} className="space-y-3 pt-2">
      <div className="space-y-1">
        <Label className="text-xs">Item Name</Label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Rice, Sugar, Shampoo"
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Qty</Label>
          <Input type="number" min="0.01" step="0.01" value={qty} onChange={e => setQty(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Unit</Label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">₹ Price</Label>
          <Input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" required />
        </div>
      </div>
      <Button type="submit" size="sm" className="w-full">
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add to Cart
      </Button>
    </form>
  );
}

// ── Scan single item ───────────────────────────────────────────────────────

function ScanAddForm({ onAdd }: { onAdd: (entry: Omit<CartEntry, 'tempId'>) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<{ name: string; qty: string; unit: string; price: string } | null>(null);
  const [error, setError] = useState('');
  const [edited, setEdited] = useState({ name: '', qty: '1', unit: 'piece', price: '' });

  const scan = async (file: File) => {
    setError(''); setResult(null);
    setPreview(URL.createObjectURL(file));
    setScanning(true);
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch('/api/ocr', { method: 'POST', body: fd });
    setScanning(false);
    const data = await res.json();
    if (res.ok && data.name) {
      setResult(data);
      setEdited({ name: data.name ?? '', qty: data.qty ?? '1', unit: data.unit ?? 'piece', price: data.price ?? '' });
    } else {
      setError(data.error ?? 'Could not extract item. Try a clearer image.');
    }
  };

  const confirm = () => {
    if (!edited.name || !edited.price) return;
    onAdd({ itemId: null, name: edited.name, unit: edited.unit, price: edited.price, qty: parseFloat(edited.qty) || 1, custom: true });
    setResult(null); setPreview(null); setEdited({ name: '', qty: '1', unit: 'piece', price: '' });
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => fileRef.current?.click()}>
          <Camera className="h-3.5 w-3.5 mr-1.5" />
          {preview ? 'Retake / Reupload' : 'Take Photo / Upload'}
        </Button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) scan(f); }} />
      </div>

      {preview && (
        <div className="rounded-md overflow-hidden border max-h-28 flex items-center justify-center bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Captured" className="max-h-28 w-auto object-contain" />
        </div>
      )}

      {scanning && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ScanLine className="h-3.5 w-3.5 animate-pulse text-primary" />
          AI is reading the image…
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {result && (
        <div className="space-y-2 rounded-md border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground">Confirm details:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2 space-y-0.5">
              <Label className="text-xs">Name</Label>
              <Input value={edited.name} onChange={e => setEdited(v => ({ ...v, name: e.target.value }))} />
            </div>
            <div className="space-y-0.5">
              <Label className="text-xs">Qty</Label>
              <Input type="number" value={edited.qty} onChange={e => setEdited(v => ({ ...v, qty: e.target.value }))} />
            </div>
            <div className="space-y-0.5">
              <Label className="text-xs">Unit</Label>
              <Select value={edited.unit} onValueChange={v => setEdited(u => ({ ...u, unit: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-0.5">
              <Label className="text-xs">₹ Price per unit</Label>
              <Input type="number" value={edited.price} onChange={e => setEdited(v => ({ ...v, price: e.target.value }))} placeholder="0.00" />
            </div>
          </div>
          <Button size="sm" className="w-full" onClick={confirm} disabled={!edited.name || !edited.price}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add to Cart
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Upload bill (multi-item extraction) ───────────────────────────────────

function BillUploadForm({ onAddMany }: { onAddMany: (entries: Omit<CartEntry, 'tempId'>[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedItem[]>([]);
  const [error, setError] = useState('');

  const scan = async (file: File) => {
    setError(''); setExtracted([]);
    setPreview(URL.createObjectURL(file));
    setScanning(true);
    const fd = new FormData();
    fd.append('image', file);
    fd.append('mode', 'bill');
    const res = await fetch('/api/ocr', { method: 'POST', body: fd });
    setScanning(false);
    const data = await res.json();
    if (res.ok && Array.isArray(data.items) && data.items.length > 0) {
      setExtracted(
        data.items.map((item: Record<string, string>, i: number) => ({
          id: String(i),
          name: item.name ?? '',
          qty: item.qty ?? '1',
          unit: item.unit ?? 'piece',
          price: item.price ?? '0',
          selected: true,
        }))
      );
    } else {
      setError(data.error ?? 'No items detected. Try a clearer image of the bill.');
    }
  };

  const toggle = (id: string) =>
    setExtracted(prev => prev.map(e => e.id === id ? { ...e, selected: !e.selected } : e));

  const updateField = (id: string, field: keyof ExtractedItem, value: string) =>
    setExtracted(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));

  const addSelected = () => {
    const chosen = extracted
      .filter(e => e.selected && e.name)
      .map(e => ({ itemId: null, name: e.name, unit: e.unit, price: e.price || '0', qty: parseFloat(e.qty) || 1, custom: true as const }));
    if (chosen.length > 0) {
      onAddMany(chosen);
      setExtracted([]);
      setPreview(null);
    }
  };

  const selectedCount = extracted.filter(e => e.selected).length;

  return (
    <div className="space-y-3 pt-2">
      <Button variant="outline" size="sm" className="w-full" onClick={() => fileRef.current?.click()}>
        <Receipt className="h-3.5 w-3.5 mr-1.5" />
        {preview ? 'Upload Different Bill' : 'Upload Bill / Receipt'}
      </Button>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) scan(f); }} />

      {preview && (
        <div className="rounded-md overflow-hidden border max-h-24 flex items-center justify-center bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Bill" className="max-h-24 w-auto object-contain" />
        </div>
      )}

      {scanning && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ScanLine className="h-3.5 w-3.5 animate-pulse text-primary" />
          Scanning bill for all items…
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {extracted.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">{extracted.length} items found</p>
            <button
              className="text-xs text-primary hover:underline"
              onClick={() => setExtracted(prev => prev.map(e => ({ ...e, selected: !prev.every(x => x.selected) })))}
            >
              {extracted.every(e => e.selected) ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {extracted.map(item => (
              <div key={item.id} className={cn('rounded-md border p-2 text-xs transition-colors', item.selected ? 'bg-primary/5 border-primary/30' : 'bg-muted/30')}>
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={item.selected}
                    onCheckedChange={() => toggle(item.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <Input
                      value={item.name}
                      onChange={e => updateField(item.id, 'name', e.target.value)}
                      className="h-6 text-xs px-2"
                      placeholder="Item name"
                    />
                    <div className="grid grid-cols-3 gap-1">
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={e => updateField(item.id, 'qty', e.target.value)}
                        className="h-6 text-xs px-2"
                        placeholder="Qty"
                      />
                      <Select value={item.unit} onValueChange={v => updateField(item.id, 'unit', v)}>
                        <SelectTrigger className="h-6 text-xs px-2"><SelectValue /></SelectTrigger>
                        <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={item.price}
                        onChange={e => updateField(item.id, 'price', e.target.value)}
                        className="h-6 text-xs px-2"
                        placeholder="₹"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button size="sm" className="w-full" onClick={addSelected} disabled={selectedCount === 0}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add {selectedCount} item{selectedCount !== 1 ? 's' : ''} to Cart
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Main ShoppingView ──────────────────────────────────────────────────────

export function ShoppingView({
  critical,
  low,
  optional,
}: {
  critical: ItemWithDetails[];
  low: ItemWithDetails[];
  optional: ItemWithDetails[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [budget, setBudget] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const cartTotal = cart.reduce((sum, e) => sum + e.qty * parseFloat(e.price), 0);
  const budgetNum = parseFloat(budget);
  const budgetPct = budget && budgetNum > 0 ? Math.min((cartTotal / budgetNum) * 100, 100) : 0;

  // Add item from the inventory list (has a DB id)
  const addInventoryItem = (item: ItemWithDetails) => {
    setCart(prev => {
      const existing = prev.find(e => e.itemId === item.id);
      if (existing) {
        return prev.map(e => e.itemId === item.id ? { ...e, qty: e.qty + 1 } : e);
      }
      return [...prev, { tempId: `inv-${item.id}`, itemId: item.id, name: item.name, unit: item.unit, price: item.price, qty: 1 }];
    });
    setCartOpen(true);
  };

  // Add a custom item (from manual/scan — no DB id yet)
  const addCustomItem = (entry: Omit<CartEntry, 'tempId'>) => {
    setCart(prev => {
      const existing = prev.find(e => e.name.toLowerCase() === entry.name.toLowerCase());
      if (existing) {
        return prev.map(e =>
          e.name.toLowerCase() === entry.name.toLowerCase()
            ? { ...e, qty: e.qty + (entry.qty || 1) }
            : e
        );
      }
      return [...prev, { ...entry, tempId: uid() }];
    });
    setAddPanelOpen(false);
  };

  const addManyCustomItems = (entries: Omit<CartEntry, 'tempId'>[]) => {
    setCart(prev => {
      let updated = [...prev];
      for (const entry of entries) {
        const existing = updated.find(e => e.name.toLowerCase() === entry.name.toLowerCase());
        if (existing) {
          updated = updated.map(e =>
            e.name.toLowerCase() === entry.name.toLowerCase()
              ? { ...e, qty: e.qty + (entry.qty || 1) }
              : e
          );
        } else {
          updated = [...updated, { ...entry, tempId: uid() }];
        }
      }
      return updated;
    });
    setAddPanelOpen(false);
  };

  const updateQty = (tempId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(e => e.tempId === tempId ? { ...e, qty: Math.max(0, e.qty + delta) } : e)
        .filter(e => e.qty > 0)
    );
  };

  const remove = (tempId: string) => setCart(prev => prev.filter(e => e.tempId !== tempId));

  const checkout = () => {
    startTransition(async () => {
      const result = await completePurchaseCartAction(
        cart.map(e => ({
          itemId: e.itemId,
          name: e.name,
          unit: e.unit,
          qty: String(e.qty),
          unitPrice: e.price,
        }))
      );
      if (result.success) {
        setDone(true);
        setCart([]);
        setTimeout(() => { setDone(false); setCartOpen(false); router.refresh(); }, 2000);
      }
    });
  };

  const sections = [
    { title: 'Needed Now', subtitle: 'Stock below 5', items: critical, badge: 'destructive' as const },
    { title: 'Low Stock', subtitle: 'Stock 5–20', items: low, badge: 'warning' as const },
    { title: 'Optional', subtitle: 'Well stocked', items: optional, badge: 'success' as const },
  ];

  return (
    <div className="pb-20 md:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Shopping Mode</h2>

        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart
              {cart.length > 0 && (
                <Badge className="ml-2 h-5 text-xs">{cart.length}</Badge>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-[340px] flex flex-col gap-0 p-0">
            {/* Cart header */}
            <SheetHeader className="px-5 pt-5 pb-3 border-b shrink-0">
              <div className="flex items-center justify-between">
                <SheetTitle>Cart ({cart.length})</SheetTitle>
                <Button
                  variant={addPanelOpen ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setAddPanelOpen(v => !v)}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className={cn('h-3.5 w-3.5 transition-transform', addPanelOpen && 'rotate-45')} />
                  Add Items
                  <ChevronDown className={cn('h-3 w-3 transition-transform', addPanelOpen && 'rotate-180')} />
                </Button>
              </div>
            </SheetHeader>

            {/* ── Add items panel ──────────────────────────────────────── */}
            {addPanelOpen && (
              <div className="border-b bg-muted/20 px-4 py-3 shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Add Items to Cart
                  </p>
                  <button onClick={() => setAddPanelOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <Tabs defaultValue="manual">
                  <TabsList className="w-full h-8 text-xs">
                    <TabsTrigger value="manual" className="flex-1 text-xs py-1">
                      <PenLine className="h-3 w-3 mr-1" />
                      Manual
                    </TabsTrigger>
                    <TabsTrigger value="scan" className="flex-1 text-xs py-1">
                      <Camera className="h-3 w-3 mr-1" />
                      Scan
                    </TabsTrigger>
                    <TabsTrigger value="bill" className="flex-1 text-xs py-1">
                      <Receipt className="h-3 w-3 mr-1" />
                      Bill
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="manual">
                    <ManualAddForm onAdd={addCustomItem} />
                  </TabsContent>
                  <TabsContent value="scan">
                    <ScanAddForm onAdd={addCustomItem} />
                  </TabsContent>
                  <TabsContent value="bill">
                    <BillUploadForm onAddMany={addManyCustomItems} />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* ── Cart list ────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 min-h-0">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Cart is empty</p>
                  <p className="text-xs text-muted-foreground">
                    Add items from the list or use the &quot;Add Items&quot; button above
                  </p>
                </div>
              ) : done ? (
                <div className="flex flex-col items-center gap-2 py-10">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                  <p className="font-medium text-green-700">Purchase recorded!</p>
                </div>
              ) : (
                cart.map(entry => (
                  <div key={entry.tempId} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">{entry.name}</p>
                        {entry.custom && (
                          <span className="text-[9px] rounded bg-muted px-1 py-0.5 text-muted-foreground shrink-0">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {fmt(parseFloat(entry.price))}/{entry.unit}
                        {' · '}
                        {fmt(parseFloat(entry.price) * entry.qty)} total
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon-xs" variant="outline" onClick={() => updateQty(entry.tempId, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm w-6 text-center">{entry.qty}</span>
                      <Button size="icon-xs" variant="outline" onClick={() => updateQty(entry.tempId, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="icon-xs" variant="ghost" className="text-destructive" onClick={() => remove(entry.tempId)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── Cart footer ───────────────────────────────────────────── */}
            {cart.length > 0 && !done && (
              <div className="border-t px-5 py-4 space-y-3 shrink-0">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Budget (₹)</span>
                    <Input
                      type="number"
                      placeholder="Set limit"
                      value={budget}
                      onChange={e => setBudget(e.target.value)}
                      className="h-7 w-28 text-xs"
                    />
                  </div>
                  {budget && (
                    <>
                      <Progress
                        value={budgetPct}
                        className={budgetPct >= 90 ? '[&>div]:bg-destructive' : ''}
                      />
                      <p className={cn('text-xs', budgetPct >= 100 ? 'text-destructive' : 'text-muted-foreground')}>
                        {fmt(cartTotal)} / {fmt(budgetNum)}
                        {budgetPct >= 100 && ' — Over budget!'}
                      </p>
                    </>
                  )}
                </div>

                <Separator />

                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{fmt(cartTotal)}</span>
                </div>

                <Button className="w-full" onClick={checkout} disabled={isPending}>
                  {isPending ? 'Processing…' : 'Complete Purchase'}
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Inventory sections ─────────────────────────────────────────── */}
      <div className="space-y-8">
        {sections.map(section => (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold">{section.title}</h3>
              <Badge variant={section.badge} className="text-xs">{section.subtitle}</Badge>
              <span className="text-xs text-muted-foreground">{section.items.length} items</span>
            </div>
            {section.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items in this category</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map(item => (
                  <ItemCard key={item.id} item={item} onAdd={addInventoryItem} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
