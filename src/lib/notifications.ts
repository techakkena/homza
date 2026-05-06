import { db } from '@/src/db';
import { items, purchases, notifications } from '@/src/db/schema';
import { eq, and, lte, gte, lt } from 'drizzle-orm';
import { subMonths } from 'date-fns';
import { createNotification } from './queries';

const LOW_STOCK_THRESHOLD = 10;
const STALE_MONTHS = 2;
const PRICE_INCREASE_THRESHOLD = 0.25; // 25%

export async function checkAndCreateNotifications(userId: number) {
  await checkLowStock(userId);
  await checkStaleItems(userId);
}

async function checkLowStock(userId: number) {
  const lowItems = await db
    .select({ id: items.id, name: items.name, stockQty: items.stockQty, unit: items.unit })
    .from(items)
    .where(and(eq(items.isActive, true), lte(items.stockQty, String(LOW_STOCK_THRESHOLD))));

  for (const item of lowItems) {
    const qty = parseFloat(item.stockQty);
    const alreadyNotified = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.relatedEntity, 'item'),
          eq(notifications.relatedId, item.id),
          eq(notifications.type, 'warning'),
          gte(notifications.createdAt, subMonths(new Date(), 1))
        )
      )
      .limit(1);

    if (alreadyNotified.length === 0) {
      const level = qty === 0 ? 'Out of Stock' : 'Low Stock';
      await createNotification({
        userId,
        title: `${level}: ${item.name}`,
        message:
          qty === 0
            ? `${item.name} is completely out of stock.`
            : `${item.name} has only ${qty} ${item.unit} remaining.`,
        type: qty === 0 ? 'error' : 'warning',
        relatedEntity: 'item',
        relatedId: item.id,
      });
    }
  }
}

async function checkStaleItems(userId: number) {
  const twoMonthsAgo = subMonths(new Date(), STALE_MONTHS);

  const allItems = await db
    .select({ id: items.id, name: items.name, updatedAt: items.updatedAt })
    .from(items)
    .where(and(eq(items.isActive, true), lt(items.updatedAt, twoMonthsAgo)));

  for (const item of allItems) {
    const recentPurchase = await db
      .select()
      .from(purchases)
      .where(and(eq(purchases.itemId, item.id), gte(purchases.purchasedAt, twoMonthsAgo)))
      .limit(1);

    if (recentPurchase.length === 0) {
      const alreadyNotified = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.relatedEntity, 'item'),
            eq(notifications.relatedId, item.id),
            eq(notifications.type, 'info'),
            gte(notifications.createdAt, subMonths(new Date(), 1))
          )
        )
        .limit(1);

      if (alreadyNotified.length === 0) {
        await createNotification({
          userId,
          title: `Item Not Updated: ${item.name}`,
          message: `${item.name} hasn't been purchased in over ${STALE_MONTHS} months.`,
          type: 'info',
          relatedEntity: 'item',
          relatedId: item.id,
        });
      }
    }
  }
}

export async function checkPriceIncrease(
  userId: number,
  itemId: number,
  newPrice: number
) {
  const lastPurchase = await db
    .select({ unitPrice: purchases.unitPrice })
    .from(purchases)
    .where(eq(purchases.itemId, itemId))
    .orderBy(purchases.purchasedAt)
    .limit(1);

  if (lastPurchase.length === 0) return;

  const oldPrice = parseFloat(lastPurchase[0].unitPrice);
  const increase = (newPrice - oldPrice) / oldPrice;

  if (increase > PRICE_INCREASE_THRESHOLD) {
    const [itemRow] = await db
      .select({ name: items.name })
      .from(items)
      .where(eq(items.id, itemId))
      .limit(1);

    await createNotification({
      userId,
      title: `Price Increase: ${itemRow?.name ?? 'Item'}`,
      message: `Price increased by ${Math.round(increase * 100)}% (₹${oldPrice.toFixed(2)} → ₹${newPrice.toFixed(2)}).`,
      type: 'warning',
      relatedEntity: 'item',
      relatedId: itemId,
    });
  }
}
