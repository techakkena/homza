import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getDashboardStats, getItemsWithDetails, getCategories } from '@/src/lib/queries';
import { getOrCreateUser } from '@/src/lib/auth';
import { checkAndCreateNotifications } from '@/src/lib/notifications';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { ItemsTable } from '@/components/dashboard/items-table';
import { InsightsDashboard } from '@/components/insights/spending-chart';
import { DashboardHeader, DashboardSectionTitle } from '@/components/dashboard/dashboard-header';
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
      <DashboardHeader />

      <StatsCards stats={stats} />

      <div>
        <DashboardSectionTitle section="inventory" />
        <ItemsTable initialItems={items} categories={categories} />
      </div>

      <div>
        <DashboardSectionTitle section="insights" />
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
