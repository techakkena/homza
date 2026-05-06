import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import { getOrCreateUser } from '@/src/lib/auth';
import { createItem, getCategories, createCategory } from '@/src/lib/queries';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  await getOrCreateUser();

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const preview = rows.slice(0, 5);
  const mode = formData.get('mode');

  if (mode !== 'confirm') {
    return Response.json({
      preview,
      total: rows.length,
      columns: Object.keys(rows[0] ?? {}),
    });
  }

  const existingCategories = await getCategories();
  const categoryMap = new Map(existingCategories.map(c => [c.name.toLowerCase(), c.id]));

  let imported = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const name = String(row['name'] ?? row['Name'] ?? row['item'] ?? row['Item'] ?? '').trim();
      const unit = String(row['unit'] ?? row['Unit'] ?? 'piece').trim();
      const price = String(row['price'] ?? row['Price'] ?? row['rate'] ?? row['Rate'] ?? '0').replace(/[^0-9.]/g, '');
      const qty = String(row['qty'] ?? row['Qty'] ?? row['quantity'] ?? row['Quantity'] ?? '0').replace(/[^0-9.]/g, '');
      const categoryName = String(row['category'] ?? row['Category'] ?? 'General').trim();

      if (!name) continue;

      let categoryId = categoryMap.get(categoryName.toLowerCase());
      if (!categoryId) {
        const newCat = await createCategory(categoryName);
        categoryId = newCat.id;
        categoryMap.set(categoryName.toLowerCase(), categoryId);
      }

      await createItem({ name, categoryId, unit, price, stockQty: qty });
      imported++;
    } catch {
      errors.push(`Row ${imported + errors.length + 1}: skipped`);
    }
  }

  return Response.json({ imported, errors });
}
