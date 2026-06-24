import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationsRead,
} from '@/lib/notifications/service';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const notifications = await getNotificationsForUser(user.id);
  const unreadCount = notifications.filter((item) => !item.read).length;

  return NextResponse.json({ notifications, unread_count: unreadCount });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { ids?: string[]; all?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (body.all) {
    await markAllNotificationsRead(user.id);
  } else if (body.ids?.length) {
    await markNotificationsRead(user.id, body.ids);
  }

  const notifications = await getNotificationsForUser(user.id);
  const unreadCount = notifications.filter((item) => !item.read).length;

  return NextResponse.json({ notifications, unread_count: unreadCount });
}
