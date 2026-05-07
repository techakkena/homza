'use client';

import { useLanguage } from '@/lib/i18n/language-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportView } from './report-view';
import { ConsumptionBalanceReport } from './consumption-balance';
import { BarChart2, Scale } from 'lucide-react';
import type { BalanceReportRow } from '@/src/lib/queries';

type MonthlyData = { month: string; total: number };
type CategoryData = { category: string; total: number };
type FrequencyData = { name: string; purchases: number };

type Props = {
  monthly: MonthlyData[];
  categories: CategoryData[];
  frequency: FrequencyData[];
  balanceRows: BalanceReportRow[];
};

export function ReportsPageClient({ monthly, categories, frequency, balanceRows }: Props) {
  const { t } = useLanguage();

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <BarChart2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.reports.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t.reports.subtitle}</p>
        </div>
      </div>

      <Tabs defaultValue="analytics">
        <TabsList className="h-11 mb-6 gap-1 p-1">
          <TabsTrigger value="analytics" className="gap-2 px-5 h-9">
            <BarChart2 className="h-4 w-4" />
            {t.reports.analytics}
          </TabsTrigger>
          <TabsTrigger value="balance" className="gap-2 px-5 h-9">
            <Scale className="h-4 w-4" />
            {t.reports.balanceReport}
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
