import { db } from '@/src/db';
import {
  items,
  categories,
  purchases,
  inventoryLogs,
  notifications,
  users,
  consumptions,
} from '@/src/db/schema';
import {
  eq,
  and,
  desc,
  asc,
  ilike,
  lte,
  gte,
  gt,
  sql,
  sum,
  count,
} from 'drizzle-orm';
import { startOfMonth, subMonths, format } from 'date-fns';

// ── Stats ──────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const [itemCount] = await db
    .select({ value: count() })
    .from(items)
    .where(eq(items.isActive, true));

  const [spendRow] = await db
    .select({ value: sum(purchases.totalAmount) })
    .from(purchases);

  const [lowStockRow] = await db
    .select({ value: count() })
    .from(items)
    .where(and(eq(items.isActive, true), lte(items.stockQty, '10')));

  const monthStart = startOfMonth(new Date());
  const [monthRow] = await db
    .select({ value: sum(purchases.totalAmount) })
    .from(purchases)
    .where(gte(purchases.purchasedAt, monthStart));

  return {
    totalItems: itemCount.value,
    totalSpend: parseFloat(spendRow.value ?? '0'),
    lowStockItems: lowStockRow.value,
    thisMonthSpend: parseFloat(monthRow.value ?? '0'),
  };
}

// ── Items ──────────────────────────────────────────────────────────────────

export type ItemWithDetails = {
  id: number;
  name: string;
  categoryId: number;
  category: string | null;
  stockQty: string;
  unit: string;
  price: string;
  sku: string | null;
  isActive: boolean;
  description: string | null;
  updatedAt: Date;
  lastPurchasedAt: Date | null;
  totalValue: number;
};

export async function getItemsWithDetails(opts: {
  search?: string;
  categoryId?: number;
  sortBy?: string;
  lowStockOnly?: boolean;
} = {}): Promise<ItemWithDetails[]> {
  const rows = await db
    .select({
      id: items.id,
      name: items.name,
      categoryId: items.categoryId,
      category: categories.name,
      stockQty: items.stockQty,
      unit: items.unit,
      price: items.price,
      sku: items.sku,
      isActive: items.isActive,
      description: items.description,
      updatedAt: items.updatedAt,
    })
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(
      and(
        eq(items.isActive, true),
        opts.search ? ilike(items.name, `%${opts.search}%`) : undefined,
        opts.categoryId ? eq(items.categoryId, opts.categoryId) : undefined,
        opts.lowStockOnly ? lte(items.stockQty, '10') : undefined,
      )
    );

  const lastPurchaseRows = await db
    .select({
      itemId: purchases.itemId,
      lastDate: sql<string>`MAX(${purchases.purchasedAt})`.as('last_date'),
    })
    .from(purchases)
    .groupBy(purchases.itemId);

  const lastMap = new Map(lastPurchaseRows.map(r => [r.itemId, r.lastDate]));

  const result: ItemWithDetails[] = rows.map(row => ({
    ...row,
    lastPurchasedAt: lastMap.has(row.id) ? new Date(lastMap.get(row.id)!) : null,
    totalValue: parseFloat(row.stockQty) * parseFloat(row.price),
  }));

  const sortKey = opts.sortBy;
  if (sortKey === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortKey === 'stock') result.sort((a, b) => parseFloat(a.stockQty) - parseFloat(b.stockQty));
  else if (sortKey === 'price') result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  else if (sortKey === 'last')
    result.sort(
      (a, b) => (b.lastPurchasedAt?.getTime() ?? 0) - (a.lastPurchasedAt?.getTime() ?? 0)
    );

  return result;
}

export async function getItemById(id: number) {
  const [item] = await db
    .select({
      id: items.id,
      name: items.name,
      categoryId: items.categoryId,
      category: categories.name,
      stockQty: items.stockQty,
      unit: items.unit,
      price: items.price,
      sku: items.sku,
      isActive: items.isActive,
      description: items.description,
    })
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(eq(items.id, id))
    .limit(1);
  return item ?? null;
}

export async function getAllItemNames(): Promise<string[]> {
  const rows = await db
    .select({ name: items.name })
    .from(items)
    .where(eq(items.isActive, true))
    .orderBy(asc(items.name));
  return rows.map(r => r.name);
}

export async function createItem(data: {
  name: string;
  categoryId: number;
  unit: string;
  price: string;
  stockQty: string;
  sku?: string;
  description?: string;
}) {
  const [item] = await db.insert(items).values(data).returning();
  return item;
}

export async function updateItem(
  id: number,
  data: Partial<{
    name: string;
    categoryId: number;
    unit: string;
    price: string;
    stockQty: string;
    sku: string;
    description: string;
    isActive: boolean;
  }>
) {
  const [item] = await db
    .update(items)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(items.id, id))
    .returning();
  return item;
}

export async function deleteItem(id: number) {
  await db.update(items).set({ isActive: false }).where(eq(items.id, id));
}

// ── Categories ─────────────────────────────────────────────────────────────

export async function getCategories() {
  return db.select().from(categories).orderBy(asc(categories.name));
}

export async function getCategoriesWithItemCount() {
  const cats = await db.select().from(categories).orderBy(asc(categories.name));
  const itemCounts = await db
    .select({ categoryId: items.categoryId, cnt: count() })
    .from(items)
    .where(eq(items.isActive, true))
    .groupBy(items.categoryId);
  const countMap = new Map(itemCounts.map(r => [r.categoryId, r.cnt]));
  return cats.map(c => ({ ...c, itemCount: countMap.get(c.id) ?? 0 }));
}

export async function createCategory(name: string, description?: string) {
  const [cat] = await db
    .insert(categories)
    .values({ name, description: description ?? null })
    .returning();
  return cat;
}

export async function updateCategory(id: number, data: { name?: string; description?: string }) {
  const [cat] = await db
    .update(categories)
    .set({ ...data })
    .where(eq(categories.id, id))
    .returning();
  return cat;
}

export async function deleteCategory(id: number) {
  const [activeItems] = await db
    .select({ value: count() })
    .from(items)
    .where(and(eq(items.categoryId, id), eq(items.isActive, true)));
  if (activeItems.value > 0) throw new Error('Cannot delete: category has active items');
  await db.delete(categories).where(eq(categories.id, id));
}

// ── Purchases + Inventory (atomic) ─────────────────────────────────────────

export async function createPurchaseWithInventoryUpdate(data: {
  userId: number;
  itemId: number;
  qty: string;
  unitPrice: string;
  notes?: string;
}) {
  const totalAmount = (parseFloat(data.qty) * parseFloat(data.unitPrice)).toFixed(2);

  return db.transaction(async tx => {
    const [currentItem] = await tx
      .select({ stockQty: items.stockQty, price: items.price })
      .from(items)
      .where(eq(items.id, data.itemId))
      .limit(1);

    if (!currentItem) throw new Error('Item not found');

    const qtyBefore = parseFloat(currentItem.stockQty);
    const qtyChange = parseFloat(data.qty);
    const qtyAfter = qtyBefore + qtyChange;

    const [purchase] = await tx
      .insert(purchases)
      .values({
        userId: data.userId,
        itemId: data.itemId,
        qty: data.qty,
        unitPrice: data.unitPrice,
        totalAmount,
        status: 'completed',
        notes: data.notes ?? null,
      })
      .returning();

    await tx
      .update(items)
      .set({ stockQty: String(qtyAfter), updatedAt: new Date() })
      .where(eq(items.id, data.itemId));

    await tx.insert(inventoryLogs).values({
      itemId: data.itemId,
      userId: data.userId,
      changeType: 'purchase',
      qtyBefore: String(qtyBefore),
      qtyChange: String(qtyChange),
      qtyAfter: String(qtyAfter),
      purchaseId: purchase.id,
      notes: data.notes ?? null,
    });

    return purchase;
  });
}

export async function updateItemStock(
  itemId: number,
  userId: number,
  newQty: number,
  reason: string
) {
  return db.transaction(async tx => {
    const [currentItem] = await tx
      .select({ stockQty: items.stockQty })
      .from(items)
      .where(eq(items.id, itemId))
      .limit(1);

    if (!currentItem) throw new Error('Item not found');

    const qtyBefore = parseFloat(currentItem.stockQty);
    const qtyChange = newQty - qtyBefore;

    await tx
      .update(items)
      .set({ stockQty: String(newQty), updatedAt: new Date() })
      .where(eq(items.id, itemId));

    await tx.insert(inventoryLogs).values({
      itemId,
      userId,
      changeType: 'adjustment',
      qtyBefore: String(qtyBefore),
      qtyChange: String(qtyChange),
      qtyAfter: String(newQty),
      notes: reason,
    });
  });
}

// ── Notifications ──────────────────────────────────────────────────────────

export async function getNotifications(userId: number) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return row.value;
}

export async function createNotification(data: {
  userId: number;
  title: string;
  message: string;
  type: string;
  relatedEntity?: string;
  relatedId?: number;
}) {
  const [n] = await db.insert(notifications).values(data).returning();
  return n;
}

export async function markNotificationRead(id: number) {
  await db
    .update(notifications)
    .set({ isRead: true, updatedAt: new Date() })
    .where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(userId: number) {
  await db
    .update(notifications)
    .set({ isRead: true, updatedAt: new Date() })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

// ── Insights ───────────────────────────────────────────────────────────────

export async function getMonthlySpending(monthsBack = 6) {
  const rows: { month: string; total: number }[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const start = startOfMonth(date);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);

    const [row] = await db
      .select({ value: sum(purchases.totalAmount) })
      .from(purchases)
      .where(and(gte(purchases.purchasedAt, start), lte(purchases.purchasedAt, end)));

    rows.push({
      month: format(date, 'MMM yyyy'),
      total: parseFloat(row.value ?? '0'),
    });
  }

  return rows;
}

export async function getCategorySpending() {
  const rows = await db
    .select({
      category: categories.name,
      total: sum(purchases.totalAmount),
    })
    .from(purchases)
    .innerJoin(items, eq(purchases.itemId, items.id))
    .innerJoin(categories, eq(items.categoryId, categories.id))
    .groupBy(categories.name)
    .orderBy(desc(sum(purchases.totalAmount)));

  return rows.map(r => ({
    category: r.category ?? 'Unknown',
    total: parseFloat(r.total ?? '0'),
  }));
}

export async function getTopSpendingItems(limit = 5) {
  const rows = await db
    .select({
      itemId: purchases.itemId,
      name: items.name,
      unit: items.unit,
      total: sum(purchases.totalAmount),
      purchases: count(),
    })
    .from(purchases)
    .innerJoin(items, eq(purchases.itemId, items.id))
    .groupBy(purchases.itemId, items.name, items.unit)
    .orderBy(desc(sum(purchases.totalAmount)))
    .limit(limit);

  return rows.map(r => ({
    itemId: r.itemId,
    name: r.name,
    unit: r.unit,
    total: parseFloat(r.total ?? '0'),
    purchases: r.purchases,
  }));
}

export async function getLowUsageItems(limit = 5) {
  const threeMonthsAgo = subMonths(new Date(), 3);

  const recentlyPurchasedIds = await db
    .selectDistinct({ itemId: purchases.itemId })
    .from(purchases)
    .where(gte(purchases.purchasedAt, threeMonthsAgo));

  const recentIds = new Set(recentlyPurchasedIds.map(r => r.itemId));

  const allItems = await db
    .select({ id: items.id, name: items.name, unit: items.unit, stockQty: items.stockQty })
    .from(items)
    .where(eq(items.isActive, true))
    .limit(50);

  return allItems
    .filter(item => !recentIds.has(item.id))
    .slice(0, limit);
}

export async function getPurchaseFrequency() {
  const rows = await db
    .select({
      name: items.name,
      purchases: count(),
    })
    .from(purchases)
    .innerJoin(items, eq(purchases.itemId, items.id))
    .groupBy(items.name)
    .orderBy(desc(count()))
    .limit(8);

  return rows.map(r => ({ name: r.name, purchases: r.purchases }));
}

// ── Shopping Mode ──────────────────────────────────────────────────────────

export async function getShoppingItems() {
  const allItems = await getItemsWithDetails();

  const critical = allItems.filter(i => parseFloat(i.stockQty) < 5);
  const low = allItems.filter(i => {
    const qty = parseFloat(i.stockQty);
    return qty >= 5 && qty <= 20;
  });
  const optional = allItems.filter(i => parseFloat(i.stockQty) > 20);

  return { critical, low, optional };
}

// ── Find or Create Item (used during cart checkout for custom items) ───────

export async function findOrCreateItemByName(
  name: string,
  unit: string,
  price: string
): Promise<number> {
  const existing = await db
    .select({ id: items.id })
    .from(items)
    .where(ilike(items.name, name.trim()))
    .limit(1);

  if (existing.length > 0) return existing[0].id;

  const cats = await getCategories();
  let categoryId = cats.find(c => c.name.toLowerCase() === 'general')?.id;
  if (!categoryId) {
    const newCat = await createCategory('General');
    categoryId = newCat.id;
  }

  const [newItem] = await db
    .insert(items)
    .values({ name: name.trim(), categoryId, unit, price, stockQty: '0' })
    .returning();

  return newItem.id;
}

// ── Consumption ────────────────────────────────────────────────────────────

export async function getItemsForConsumption() {
  return db
    .select({
      id: items.id,
      name: items.name,
      unit: items.unit,
      price: items.price,
      stockQty: items.stockQty,
      category: categories.name,
    })
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(and(eq(items.isActive, true), gt(items.stockQty, '0')))
    .orderBy(asc(categories.name), asc(items.name));
}

export async function createConsumption(data: {
  itemId: number;
  userId: number;
  qty: string;
  notes?: string;
}) {
  return db.transaction(async tx => {
    const [currentItem] = await tx
      .select({ stockQty: items.stockQty })
      .from(items)
      .where(eq(items.id, data.itemId))
      .limit(1);

    if (!currentItem) throw new Error('Item not found');

    const qtyBefore = parseFloat(currentItem.stockQty);
    const qtyChange = parseFloat(data.qty);

    if (qtyChange > qtyBefore) {
      throw new Error(`Insufficient stock. Available: ${qtyBefore}`);
    }

    const qtyAfter = qtyBefore - qtyChange;

    const [consumption] = await tx
      .insert(consumptions)
      .values({
        itemId: data.itemId,
        userId: data.userId,
        qty: data.qty,
        notes: data.notes ?? null,
      })
      .returning();

    await tx
      .update(items)
      .set({ stockQty: String(qtyAfter), updatedAt: new Date() })
      .where(eq(items.id, data.itemId));

    await tx.insert(inventoryLogs).values({
      itemId: data.itemId,
      userId: data.userId,
      changeType: 'consumption',
      qtyBefore: String(qtyBefore),
      qtyChange: String(-qtyChange),
      qtyAfter: String(qtyAfter),
      notes: data.notes ?? null,
    });

    return consumption;
  });
}

export type BalanceReportRow = {
  id: number;
  name: string;
  unit: string;
  price: number;
  category: string;
  purchasedQty: number;
  purchasedAmount: number;
  consumedQty: number;
  balanceQty: number;
  balanceValue: number;
};

export async function getConsumptionBalanceReport(): Promise<BalanceReportRow[]> {
  const allItems = await db
    .select({
      id: items.id,
      name: items.name,
      unit: items.unit,
      price: items.price,
      stockQty: items.stockQty,
      category: categories.name,
    })
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(eq(items.isActive, true))
    .orderBy(asc(categories.name), asc(items.name));

  const purchasedRows = await db
    .select({
      itemId: purchases.itemId,
      totalQty: sum(purchases.qty),
      totalAmount: sum(purchases.totalAmount),
    })
    .from(purchases)
    .groupBy(purchases.itemId);

  const consumedRows = await db
    .select({
      itemId: consumptions.itemId,
      totalQty: sum(consumptions.qty),
    })
    .from(consumptions)
    .groupBy(consumptions.itemId);

  const purchasedMap = new Map(purchasedRows.map(r => [r.itemId, r]));
  const consumedMap = new Map(consumedRows.map(r => [r.itemId, r.totalQty]));

  return allItems
    .filter(item => purchasedMap.has(item.id) || parseFloat(item.stockQty) > 0)
    .map(item => {
      const purchased = purchasedMap.get(item.id);
      const balanceQty = parseFloat(item.stockQty);
      const priceNum = parseFloat(item.price);
      return {
        id: item.id,
        name: item.name,
        unit: item.unit,
        price: priceNum,
        category: item.category ?? 'Uncategorized',
        purchasedQty: parseFloat(purchased?.totalQty ?? '0'),
        purchasedAmount: parseFloat(purchased?.totalAmount ?? '0'),
        consumedQty: parseFloat(consumedMap.get(item.id) ?? '0'),
        balanceQty,
        balanceValue: balanceQty * priceNum,
      };
    });
}

// ── Reports CSV ────────────────────────────────────────────────────────────

export async function getAllPurchasesForExport() {
  return db
    .select({
      date: purchases.purchasedAt,
      item: items.name,
      category: categories.name,
      qty: purchases.qty,
      unit: items.unit,
      unitPrice: purchases.unitPrice,
      totalAmount: purchases.totalAmount,
      status: purchases.status,
    })
    .from(purchases)
    .innerJoin(items, eq(purchases.itemId, items.id))
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .orderBy(desc(purchases.purchasedAt));
}
