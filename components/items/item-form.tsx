'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addItemAction, editItemAction, addCategoryAction } from '@/src/lib/actions';

type Category = { id: number; name: string };

const UNITS = ['kg', 'gram', 'liter', 'ml', 'piece', 'pack', 'box', 'bottle', 'dozen', 'bag'];

type Props = {
  categories: Category[];
  editItem?: {
    id: number;
    name: string;
    categoryId: number;
    unit: string;
    price: string;
    stockQty: string;
    sku: string | null;
    description: string | null;
  } | null;
};

export function ItemForm({ categories: initialCategories, editItem }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState(initialCategories);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');
  const [totalCost, setTotalCost] = useState('0');

  const [form, setForm] = useState({
    name: editItem?.name ?? '',
    categoryId: editItem?.categoryId ? String(editItem.categoryId) : '',
    unit: editItem?.unit ?? 'piece',
    price: editItem?.price ?? '',
    stockQty: editItem?.stockQty ?? '',
    sku: editItem?.sku ?? '',
    description: editItem?.description ?? '',
  });

  const allItemNames = ['Rice', 'Wheat Flour', 'Sugar', 'Salt', 'Oil', 'Dal', 'Milk', 'Bread'];
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const cost = parseFloat(form.price) * parseFloat(form.stockQty);
    setTotalCost(isNaN(cost) ? '0' : cost.toFixed(2));
  }, [form.price, form.stockQty]);

  const set = (k: keyof typeof form) => (v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    if (k === 'name') {
      const q = v.toLowerCase();
      setSuggestions(q.length > 1 ? allItemNames.filter(n => n.toLowerCase().includes(q)) : []);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    startTransition(async () => {
      const result = editItem
        ? await editItemAction(editItem.id, fd)
        : await addItemAction(fd);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error ?? 'Error');
      }
    });
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append('name', newCategory.trim());
      const result = await addCategoryAction(fd);
      if (result.success && result.category) {
        setCategories(prev => [...prev, result.category!]);
        setForm(f => ({ ...f, categoryId: String(result.category!.id) }));
        setNewCategory('');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {/* Name with autocomplete */}
      <div className="space-y-1.5 relative">
        <Label htmlFor="name">Item Name *</Label>
        <Input
          id="name"
          value={form.name}
          onChange={e => set('name')(e.target.value)}
          placeholder="e.g. Basmati Rice"
          required
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 rounded-md border bg-popover shadow-md text-sm">
            {suggestions.map(s => (
              <li
                key={s}
                className="px-3 py-2 hover:bg-accent cursor-pointer"
                onClick={() => { set('name')(s); setSuggestions([]); }}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label>Category *</Label>
        <div className="flex gap-2">
          <Select value={form.categoryId} onValueChange={set('categoryId')}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <Input
              placeholder="New category"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="w-32"
            />
            <Button type="button" variant="outline" onClick={handleAddCategory}>
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Unit + Quantity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Unit *</Label>
          <Select value={form.unit} onValueChange={set('unit')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map(u => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qty">Quantity *</Label>
          <Input
            id="qty"
            name="stockQty"
            type="number"
            step="0.001"
            min="0"
            value={form.stockQty}
            onChange={e => set('stockQty')(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Price */}
      <div className="space-y-1.5">
        <Label htmlFor="price">Price per {form.unit} (₹) *</Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          value={form.price}
          onChange={e => set('price')(e.target.value)}
          required
        />
      </div>

      {/* Total cost display */}
      {parseFloat(totalCost) > 0 && (
        <div className="rounded-md bg-primary/5 border border-primary/20 px-4 py-2 text-sm">
          <span className="text-muted-foreground">Total cost: </span>
          <span className="font-semibold text-primary">
            ₹{parseFloat(totalCost).toLocaleString('en-IN')}
          </span>
        </div>
      )}

      {/* SKU + Description */}
      <div className="space-y-1.5">
        <Label htmlFor="sku">SKU (optional)</Label>
        <Input
          id="sku"
          value={form.sku}
          onChange={e => set('sku')(e.target.value)}
          placeholder="e.g. RICE-001"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="desc">Notes (optional)</Label>
        <Textarea
          id="desc"
          value={form.description}
          onChange={e => set('description')(e.target.value)}
          placeholder="Any notes..."
          rows={2}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : editItem ? 'Update Item' : 'Add Item'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
