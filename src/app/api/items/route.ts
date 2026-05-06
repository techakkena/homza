import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { getItemsWithDetails, createItem } from '@/src/lib/queries';
import { getOrCreateUser } from '@/src/lib/auth';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') ?? undefined;
  const categoryId = searchParams.get('categoryId')
    ? parseInt(searchParams.get('categoryId')!)
    : undefined;
  const sortBy = searchParams.get('sortBy') ?? undefined;
  const lowStockOnly = searchParams.get('lowStockOnly') === 'true';

  const items = await getItemsWithDetails({ search, categoryId, sortBy, lowStockOnly });
  return Response.json(items);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  await getOrCreateUser();

  const body = await request.json();
  const { name, categoryId, unit, price, stockQty, sku, description } = body;

  if (!name || !categoryId || !unit || !price || !stockQty) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const item = await createItem({ name, categoryId, unit, price, stockQty, sku, description });
  return Response.json(item, { status: 201 });
}
