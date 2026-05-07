'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Tag, AlertTriangle } from 'lucide-react';
import { addCategoryAction, updateCategoryAction, deleteCategoryAction } from '@/src/lib/actions';
import { useLanguage } from '@/lib/i18n/language-context';

type Category = { id: number; name: string; description: string | null; itemCount: number };

export function CategoryManager({ categories: initialCategories }: { categories: Category[] }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState(initialCategories);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [error, setError] = useState('');
  const [dialogError, setDialogError] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    setError('');
    startTransition(async () => {
      const fd = new FormData();
      fd.append('name', newName.trim());
      if (newDesc.trim()) fd.append('description', newDesc.trim());
      const result = await addCategoryAction(fd);
      if (result.success && result.category) {
        setCategories(prev => [...prev, { ...result.category!, itemCount: 0 }]);
        setNewName(''); setNewDesc('');
        router.refresh();
      } else {
        setError(result.error ?? 'Failed');
      }
    });
  };

  const handleEdit = () => {
    if (!editItem || !editName.trim()) return;
    setDialogError('');
    startTransition(async () => {
      const result = await updateCategoryAction(editItem.id, { name: editName.trim(), description: editDesc.trim() || undefined });
      if (result.success) {
        setCategories(prev => prev.map(c => c.id === editItem.id ? { ...c, name: editName.trim(), description: editDesc.trim() || null } : c));
        setEditItem(null);
        router.refresh();
      } else {
        setDialogError(result.error ?? 'Failed');
      }
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setDialogError('');
    startTransition(async () => {
      const result = await deleteCategoryAction(deleteId);
      if (result.success) {
        setCategories(prev => prev.filter(c => c.id !== deleteId));
        setDeleteId(null);
        router.refresh();
      } else {
        setDialogError(result.error ?? 'Failed');
      }
    });
  };

  const deleteTarget = categories.find(c => c.id === deleteId);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Add form */}
      <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          {t.items.addNewCategory}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t.items.categoryName} *</Label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Frozen Foods" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t.items.description} ({t.common.optional})</Label>
            <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief description..." />
          </div>
        </div>
        {error && <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{error}</p>}
        <Button size="sm" onClick={handleAdd} disabled={isPending || !newName.trim()} className="h-8">
          <Plus className="h-3.5 w-3.5 mr-1.5" />{t.items.addNewCategory}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs font-semibold">{t.items.category}</TableHead>
              <TableHead className="text-xs font-semibold">{t.items.description}</TableHead>
              <TableHead className="text-xs font-semibold text-right">{t.items.itemCount}</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-10 text-sm">{t.items.noCategories}</TableCell></TableRow>
            ) : categories.map(cat => (
              <TableRow key={cat.id} className="hover:bg-muted/20">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-primary/10"><Tag className="h-3 w-3 text-primary" /></div>
                    <span className="font-medium text-sm">{cat.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                  {cat.description ?? <span className="italic opacity-50">{t.common.noDescription}</span>}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={cat.itemCount > 0 ? 'secondary' : 'outline'} className="text-xs">
                    {cat.itemCount} {cat.itemCount === 1 ? t.common.item : t.common.items}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon-xs" className="h-7 w-7"
                      onClick={() => { setEditItem(cat); setEditName(cat.name); setEditDesc(cat.description ?? ''); setDialogError(''); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { setDeleteId(cat.id); setDialogError(''); }}
                      disabled={cat.itemCount > 0}
                      title={cat.itemCount > 0 ? 'Cannot delete: has active items' : t.items.deleteCategory}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editItem} onOpenChange={open => !open && setEditItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.items.editCategory}</DialogTitle>
            <DialogDescription>{t.items.editCategoryDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t.items.categoryName} *</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEdit()} />
            </div>
            <div className="space-y-1.5">
              <Label>{t.items.description}</Label>
              <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Optional..." />
            </div>
            {dialogError && <p className="text-sm text-destructive flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" />{dialogError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>{t.common.cancel}</Button>
            <Button onClick={handleEdit} disabled={isPending || !editName.trim()}>{t.common.saveChanges}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.items.deleteCategory}</DialogTitle>
            <DialogDescription>{t.items.deleteCategoryDesc} <strong>{deleteTarget?.name}</strong>?</DialogDescription>
          </DialogHeader>
          {dialogError && <p className="text-sm text-destructive flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" />{dialogError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>{t.common.cancel}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>{t.items.deleteCategory}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
