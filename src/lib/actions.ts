'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from './auth';
import {
  createItem,
  updateItem,
  deleteItem,
  createCategory,
  createPurchaseWithInventoryUpdate,
  updateItemStock,
  markNotificationRead,
  markAllNotificationsRead,
  findOrCreateItemByName,
} from './queries';
import { checkPriceIncrease, checkAndCreateNotifications } from './notifications';

// ── Items ──────────────────────────────────────────────────────────────────

export async function addItemAction(formData: FormData) {
  await requireUser();

  const name = formData.get('name') as string;
  const categoryId = parseInt(formData.get('categoryId') as string);
  const unit = formData.get('unit') as string;
  const price = formData.get('price') as string;
  const stockQty = formData.get('stockQty') as string;
  const sku = (formData.get('sku') as string) || undefined;
  const description = (formData.get('description') as string) || undefined;

  if (!name || !categoryId || !unit || !price || !stockQty) {
    return { success: false, error: 'Missing required fields' };
  }

  try {
    const item = await createItem({ name, categoryId, unit, price, stockQty, sku, description });
    revalidatePath('/dashboard');
    revalidatePath('/items');
    return { success: true, item };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create item';
    return { success: false, error: msg };
  }
}

export async function editItemAction(id: number, formData: FormData) {
  await requireUser();

  const data: Record<string, string> = {};
  for (const key of ['name', 'unit', 'price', 'stockQty', 'sku', 'description']) {
    const val = formData.get(key) as string;
    if (val) data[key] = val;
  }
  const categoryIdStr = formData.get('categoryId') as string;
  const categoryId = categoryIdStr ? parseInt(categoryIdStr) : undefined;

  try {
    const item = await updateItem(id, { ...data, ...(categoryId ? { categoryId } : {}) });
    revalidatePath('/dashboard');
    revalidatePath('/items');
    return { success: true, item };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update item';
    return { success: false, error: msg };
  }
}

export async function deleteItemAction(id: number) {
  await requireUser();
  await deleteItem(id);
  revalidatePath('/dashboard');
  revalidatePath('/items');
  return { success: true };
}

export async function updateStockAction(itemId: number, newQty: number, reason: string) {
  const user = await requireUser();
  await updateItemStock(itemId, user.id, newQty, reason);
  revalidatePath('/dashboard');
  return { success: true };
}

// ── Categories ─────────────────────────────────────────────────────────────

export async function addCategoryAction(formData: FormData) {
  await requireUser();
  const name = formData.get('name') as string;
  const description = (formData.get('description') as string) || undefined;
  if (!name) return { success: false, error: 'Name required' };
  const cat = await createCategory(name, description);
  revalidatePath('/items');
  return { success: true, category: cat };
}

// ── Purchases ─────────────────────────────────────────────────────────────

export async function recordPurchaseAction(data: {
  itemId: number;
  qty: string;
  unitPrice: string;
  notes?: string;
}) {
  const user = await requireUser();

  try {
    await checkPriceIncrease(user.id, data.itemId, parseFloat(data.unitPrice));
    const purchase = await createPurchaseWithInventoryUpdate({ ...data, userId: user.id });
    revalidatePath('/dashboard');
    revalidatePath('/shopping');
    return { success: true, purchase };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Purchase failed';
    return { success: false, error: msg };
  }
}

export async function completePurchaseCartAction(
  cartItems: Array<{
    itemId: number | null;
    name?: string;
    unit?: string;
    qty: string;
    unitPrice: string;
  }>
) {
  const user = await requireUser();

  try {
    for (const entry of cartItems) {
      let resolvedId = entry.itemId;

      // Custom items (from manual/scan/bill) may not have a DB id yet
      if (!resolvedId && entry.name) {
        resolvedId = await findOrCreateItemByName(
          entry.name,
          entry.unit ?? 'piece',
          entry.unitPrice
        );
      }

      if (!resolvedId) continue;

      await checkPriceIncrease(user.id, resolvedId, parseFloat(entry.unitPrice));
      await createPurchaseWithInventoryUpdate({
        itemId: resolvedId,
        qty: entry.qty,
        unitPrice: entry.unitPrice,
        userId: user.id,
      });
    }
    revalidatePath('/dashboard');
    revalidatePath('/shopping');
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Cart purchase failed';
    return { success: false, error: msg };
  }
}

// ── Notifications ──────────────────────────────────────────────────────────

export async function markNotificationReadAction(id: number) {
  await requireUser();
  await markNotificationRead(id);
  revalidatePath('/');
  return { success: true };
}

export async function markAllReadAction() {
  const user = await requireUser();
  await markAllNotificationsRead(user.id);
  revalidatePath('/');
  return { success: true };
}

export async function runNotificationCheckAction() {
  const user = await requireUser();
  await checkAndCreateNotifications(user.id);
  revalidatePath('/');
  return { success: true };
}
