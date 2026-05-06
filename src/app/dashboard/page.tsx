import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getDashboardStats, getItemsWithDetails, getCategories } from '@/src/lib/queries';
import { getOrCreateUser } from '@/src/lib/auth';
import { checkAndCreateNotifications } from '@/src/lib/notifications';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { ItemsTable } from '@/components/dashboard/items-table';
import { InsightsDashboard } from '@/components/insights/spending-chart';
import {
  getMonthlySpending,
  getCategorySpending,
  getTopSpendingItems,
  getLowUsageItems,
} from '@/src/lib/queries';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; sort?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/');

  const user = await getOrCreateUser();
  if (user) {
    // Run notification checks in background (non-blocking)
    checkAndCreateNotifications(user.id).catch(() => {});
  }

  const { search, category, sort } = await searchParams;

  const [stats, items, categories, monthly, catSpend, topItems, lowUsage] = await Promise.all([
    getDashboardStats(),
    getItemsWithDetails({
      search,
      categoryId: category ? parseInt(category) : undefined,
      sortBy: sort,
    }),
    getCategories(),
    getMonthlySpending(6),
    getCategorySpending(),
    getTopSpendingItems(5),
    getLowUsageItems(5),
  ]);

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Your household inventory at a glance</p>
      </div>

      <StatsCards stats={stats} />

      <div>
        <h2 className="text-base font-semibold mb-4">Inventory</h2>
        <ItemsTable initialItems={items} categories={categories} />
      </div>

      <div>
        <h2 className="text-base font-semibold mb-4">Smart Insights</h2>
        <InsightsDashboard
          monthly={monthly}
          categories={catSpend}
          topItems={topItems}
          lowUsage={lowUsage}
        />
      </div>
    </div>
  );
}
