import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import {
  getMonthlySpending,
  getCategorySpending,
  getPurchaseFrequency,
} from '@/src/lib/queries';
import { ReportView } from '@/components/reports/report-view';

export default async function ReportsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/');

  const [monthly, categories, frequency] = await Promise.all([
    getMonthlySpending(12),
    getCategorySpending(),
    getPurchaseFrequency(),
  ]);

  return (
    <div className="p-6">
      <ReportView monthly={monthly} categories={categories} frequency={frequency} />
    </div>
  );
}
