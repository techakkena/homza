import { auth } from '@clerk/nextjs/server';
import {
  getMonthlySpending,
  getCategorySpending,
  getTopSpendingItems,
  getLowUsageItems,
  getPurchaseFrequency,
} from '@/src/lib/queries';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [monthly, categories, topItems, lowUsage, frequency] = await Promise.all([
    getMonthlySpending(6),
    getCategorySpending(),
    getTopSpendingItems(5),
    getLowUsageItems(5),
    getPurchaseFrequency(),
  ]);

  return Response.json({ monthly, categories, topItems, lowUsage, frequency });
}
