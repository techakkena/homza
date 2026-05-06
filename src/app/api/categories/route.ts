import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { getCategories, createCategory } from '@/src/lib/queries';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const cats = await getCategories();
  return Response.json(cats);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, description } = await request.json();
  if (!name) return Response.json({ error: 'Name required' }, { status: 400 });

  const cat = await createCategory(name, description);
  return Response.json(cat, { status: 201 });
}
