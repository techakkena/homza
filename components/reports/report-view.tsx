'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type MonthlyData = { month: string; total: number };
type CategoryData = { category: string; total: number };
type FrequencyData = { name: string; purchases: number };

const COLORS = ['#0D9488', '#22C55E', '#2563EB', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export function ReportView({
  monthly,
  categories,
  frequency,
}: {
  monthly: MonthlyData[];
  categories: CategoryData[];
  frequency: FrequencyData[];
}) {
  const [downloading, setDownloading] = useState(false);

  const downloadCSV = async () => {
    setDownloading(true);
    const res = await fetch('/api/reports');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchases-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(false);
  };

  const hasData = monthly.some(m => m.total > 0);

  return (
    <div className="space-y-6">
      {/* Header + download */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reports & Analytics</h2>
        <Button variant="outline" onClick={downloadCSV} disabled={downloading}>
          <Download className="h-4 w-4 mr-2" />
          {downloading ? 'Downloading…' : 'Export CSV'}
        </Button>
      </div>

      {!hasData ? (
        <div className="rounded-lg border border-dashed p-16 text-center">
          <p className="text-muted-foreground">No purchase data yet. Start adding purchases to see reports.</p>
        </div>
      ) : (
        <>
          {/* Monthly bar chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Monthly Expenditure</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                  <Tooltip
                    formatter={(v) => [fmt(Number(v) || 0), 'Total Spend']}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="total" fill="#0D9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Category pie */}
            {categories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Category-wise Spending</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={categories}
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        dataKey="total"
                        nameKey="category"
                      >
                        {categories.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => fmt(Number(v) || 0)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Purchase frequency */}
            {frequency.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Purchase Frequency (Top Items)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={frequency} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Line
                        type="monotone"
                        dataKey="purchases"
                        stroke="#0D9488"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#0D9488' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
