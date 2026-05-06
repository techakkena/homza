import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { getOrCreateUser } from '@/src/lib/auth';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/src/lib/queries';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getOrCreateUser();
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

  const notes = await getNotifications(user.id);
  return Response.json(notes);
}

export async function PATCH(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getOrCreateUser();
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

  const body = await request.json();

  if (body.markAll) {
    await markAllNotificationsRead(user.id);
  } else if (body.id) {
    await markNotificationRead(body.id);
  }

  return Response.json({ success: true });
}
