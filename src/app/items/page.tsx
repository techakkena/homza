import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import {
  getCategories,
  getItemById,
  getItemsForConsumption,
  getCategoriesWithItemCount,
} from '@/src/lib/queries';
import { ItemsPageClient } from '@/components/items/items-page-client';

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; tab?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/');

  const { edit, tab } = await searchParams;
  const editId = edit ? parseInt(edit) : null;

  const [categories, itemsForConsumption, categoriesWithCount, editItem] = await Promise.all([
    getCategories(),
    getItemsForConsumption(),
    getCategoriesWithItemCount(),
    editId ? getItemById(editId) : Promise.resolve(null),
  ]);

  return (
    <ItemsPageClient
      categories={categories}
      itemsForConsumption={itemsForConsumption}
      categoriesWithCount={categoriesWithCount}
      editItem={editItem}
      defaultTab={tab ?? 'add'}
    />
  );
}
