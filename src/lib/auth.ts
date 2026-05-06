import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const [newUser] = await db
    .insert(users)
    .values({
      clerkId: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
      name:
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
        'User',
      role: 'user',
    })
    .returning();

  return newUser;
}

export async function requireUser() {
  const user = await getOrCreateUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}
