import { auth } from '@clerk/nextjs/server';
import { getAllPurchasesForExport } from '@/src/lib/queries';
import { format } from 'date-fns';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await getAllPurchasesForExport();

  const headers = ['Date', 'Item', 'Category', 'Qty', 'Unit', 'Unit Price', 'Total Amount', 'Status'];
  const csvRows = rows.map(r => [
    format(new Date(r.date), 'yyyy-MM-dd'),
    r.item,
    r.category ?? '',
    r.qty,
    r.unit,
    r.unitPrice,
    r.totalAmount,
    r.status,
  ].join(','));

  const csv = [headers.join(','), ...csvRows].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="purchases-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
    },
  });
}
