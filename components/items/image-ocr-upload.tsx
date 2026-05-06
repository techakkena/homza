'use client';

import { useRef, useState } from 'react';
import { Camera, ScanLine, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addItemAction } from '@/src/lib/actions';
import { cn } from '@/lib/utils';

type OCRResult = {
  name?: string;
  qty?: string;
  unit?: string;
  price?: string;
};

type Category = { id: number; name: string };

const UNITS = ['kg', 'gram', 'liter', 'ml', 'piece', 'pack', 'box', 'bottle', 'dozen'];

export function ImageOcrUpload({ categories }: { categories: Category[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [ocrData, setOcrData] = useState<OCRResult | null>(null);
  const [form, setForm] = useState({ name: '', qty: '', unit: 'piece', price: '', categoryId: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleImage = async (file: File) => {
    setOcrData(null);
    setSaved(false);
    setError('');
    const url = URL.createObjectURL(file);
    setPreview(url);
    setScanning(true);

    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch('/api/ocr', { method: 'POST', body: fd });
    const data = await res.json();
    setScanning(false);

    if (res.ok) {
      setOcrData(data);
      setForm({
        name: data.name ?? '',
        qty: data.qty ?? '',
        unit: data.unit ?? 'piece',
        price: data.price ?? '',
        categoryId: '',
      });
    } else {
      setError(data.error ?? 'OCR failed');
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.categoryId) {
      setError('Name and category are required');
      return;
    }
    setSaving(true);
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('categoryId', form.categoryId);
    fd.append('unit', form.unit);
    fd.append('price', form.price);
    fd.append('stockQty', form.qty);
    const result = await addItemAction(fd);
    setSaving(false);
    if (result.success) {
      setSaved(true);
    } else {
      setError(result.error ?? 'Failed to save');
    }
  };

  return (
    <div className="space-y-5 max-w-xl">
      <p className="text-sm text-muted-foreground">
        Upload an image of a receipt or product. AI will extract the item name, quantity, and price.
        <span className="block mt-0.5 text-xs text-amber-600">
          Requires ANTHROPIC_API_KEY in .env
        </span>
      </p>

      {/* Upload / Camera */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Camera className="h-4 w-4 mr-2" />
          Upload Image
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleImage(f); }}
        />
      </div>

      {preview && (
        <div className="rounded-lg overflow-hidden border max-w-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Uploaded" className="w-full object-cover" />
        </div>
      )}

      {scanning && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ScanLine className="h-4 w-4 animate-pulse text-primary" />
          Analyzing image with AI…
        </div>
      )}

      {ocrData && (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Extracted Data — review and confirm
          </p>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Item Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={form.qty}
                  onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Price (₹)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Category *</Label>
              <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {saved ? (
            <div className={cn('flex items-center gap-2 text-sm text-green-700')}>
              <CheckCircle2 className="h-4 w-4" />
              Item saved successfully!
            </div>
          ) : (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Confirm & Save Item'}
            </Button>
          )}
        </div>
      )}

      {error && !ocrData && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
