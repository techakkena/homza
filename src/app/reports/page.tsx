import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import {
  getMonthlySpending,
  getCategorySpending,
  getPurchaseFrequency,
  getConsumptionBalanceReport,
} from '@/src/lib/queries';
import { ReportsPageClient } from '@/components/reports/reports-page-client';

export default async function ReportsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/');

  const [monthly, categories, frequency, balanceRows] = await Promise.all([
    getMonthlySpending(12),
    getCategorySpending(),
    getPurchaseFrequency(),
    getConsumptionBalanceReport(),
  ]);

  return (
    <ReportsPageClient
      monthly={monthly}
      categories={categories}
      frequency={frequency}
      balanceRows={balanceRows}
    />
  );
}
