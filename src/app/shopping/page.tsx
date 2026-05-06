import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getShoppingItems } from '@/src/lib/queries';
import { ShoppingView } from '@/components/shopping/shopping-view';

export default async function ShoppingPage() {
  const { userId } = await auth();
  if (!userId) redirect('/');

  const { critical, low, optional } = await getShoppingItems();

  return (
    <div className="p-6">
      <ShoppingView critical={critical} low={low} optional={optional} />
    </div>
  );
}
