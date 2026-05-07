import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import {
  getMonthlySpending,
  getCategorySpending,
  getPurchaseFrequency,
  getConsumptionBalanceReport,
} from '@/src/lib/queries';
import { ReportView } from '@/components/reports/report-view';
import { ConsumptionBalanceReport } from '@/components/reports/consumption-balance';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart2, Scale } from 'lucide-react';

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
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <BarChart2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Spending analytics, consumption tracking, and inventory balance.
          </p>
        </div>
      </div>

      <Tabs defaultValue="analytics">
        <TabsList className="h-11 mb-6 gap-1 p-1">
          <TabsTrigger value="analytics" className="gap-2 px-5 h-9">
            <BarChart2 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="balance" className="gap-2 px-5 h-9">
            <Scale className="h-4 w-4" />
            Balance Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <ReportView monthly={monthly} categories={categories} frequency={frequency} />
        </TabsContent>

        <TabsContent value="balance">
          <ConsumptionBalanceReport rows={balanceRows} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
