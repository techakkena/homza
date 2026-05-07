'use client';

import { useLanguage } from '@/lib/i18n/language-context';

export function DashboardHeader() {
  const { t } = useLanguage();
  return (
    <div>
      <h1 className="text-2xl font-bold">{t.dashboard.title}</h1>
      <p className="text-muted-foreground text-sm mt-1">{t.dashboard.subtitle}</p>
    </div>
  );
}

export function DashboardSectionTitle({ section }: { section: 'inventory' | 'insights' }) {
  const { t } = useLanguage();
  return (
    <h2 className="text-base font-semibold mb-4">
      {section === 'inventory' ? t.dashboard.inventory : t.dashboard.insights}
    </h2>
  );
}
