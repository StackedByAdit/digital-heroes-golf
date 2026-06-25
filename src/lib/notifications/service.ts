import { createAdminClient } from '@/lib/supabase/server';
import { getWinnerDisplayStatus, unwrapJoin } from '@/lib/winners/helpers';
import type { UserNotification, NotificationItem } from '@/types';

export type { NotificationItem };

export async function createUserNotification(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  href?: string | null;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('user_notifications')
    .insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      href: params.href ?? null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[notifications] create failed', error.message);
    return null;
  }

  return data as UserNotification;
}

export async function getNotificationsForUser(userId: string): Promise<NotificationItem[]> {
  const admin = createAdminClient();

  const [{ data: stored }, { data: profile }, { data: winnerEntries }] = await Promise.all([
    admin
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
    admin
      .from('profiles')
      .select('subscription_status')
      .eq('id', userId)
      .single(),
    admin
      .from('draw_entries')
      .select('id, match_type, prize_amount, payment_status, proof_url, draws(month)')
      .eq('user_id', userId)
      .not('match_type', 'is', null)
      .gt('prize_amount', 0)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const items: NotificationItem[] = (stored ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    read: row.read_at !== null,
    created_at: row.created_at,
    source: 'stored' as const,
  }));

  const computedIds = new Set<string>();

  if (profile?.subscription_status === 'past_due') {
    computedIds.add('computed:past_due');
    items.unshift({
      id: 'computed:past_due',
      type: 'billing',
      title: 'Payment failed',
      body: 'Update your billing details to keep your subscription active.',
      href: '/dashboard/account',
      read: false,
      created_at: new Date().toISOString(),
      source: 'computed',
    });
  }

  if (profile?.subscription_status === 'inactive') {
    computedIds.add('computed:inactive');
    items.unshift({
      id: 'computed:inactive',
      type: 'subscription',
      title: 'Subscription inactive',
      body: 'Subscribe to enter monthly draws and log scores.',
      href: '/pricing',
      read: false,
      created_at: new Date().toISOString(),
      source: 'computed',
    });
  }

  for (const entry of winnerEntries ?? []) {
    const status = getWinnerDisplayStatus(entry);
    const drawMonth =
      unwrapJoin(entry.draws as { month: string } | { month: string }[] | null)
        ?.month ?? 'draw';

    if (status === 'pending') {
      const id = `computed:winner-pending:${entry.id}`;
      if (!computedIds.has(id)) {
        computedIds.add(id);
        items.unshift({
          id,
          type: 'winner',
          title: `You won the ${drawMonth} draw!`,
          body: 'Upload proof of your scores to claim your prize.',
          href: '/dashboard',
          read: false,
          created_at: new Date().toISOString(),
          source: 'computed',
        });
      }
    }

    if (status === 'rejected') {
      const id = `computed:winner-rejected:${entry.id}`;
      if (!computedIds.has(id)) {
        computedIds.add(id);
        items.unshift({
          id,
          type: 'winner',
          title: 'Proof needs resubmission',
          body: `Your ${drawMonth} winner verification was rejected. Upload a clearer image.`,
          href: '/dashboard',
          read: false,
          created_at: new Date().toISOString(),
          source: 'computed',
        });
      }
    }
  }

  return items
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 30);
}

export async function markNotificationsRead(userId: string, ids: string[]) {
  const storedIds = ids.filter((id) => !id.startsWith('computed:'));
  if (storedIds.length === 0) return;

  const admin = createAdminClient();
  await admin
    .from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .in('id', storedIds)
    .is('read_at', null);
}

export async function markAllNotificationsRead(userId: string) {
  const admin = createAdminClient();
  await admin
    .from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
}
