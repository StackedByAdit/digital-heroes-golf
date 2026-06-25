import { differenceInMonths } from 'date-fns';
import {
  calculatePrizePools,
  getNextMonthKey,
  totalMonthlyPoolContribution,
} from '@/lib/drawEngine';
import type { DrawWithMeta } from '@/lib/draw/processing';
import { resolveRolloverForMonth } from '@/lib/draw/processing';
import { calculateCharityContribution } from '@/lib/charity/helpers';
import { createClient } from '@/lib/supabase/server';
import { hasPlatformAccess } from '@/lib/subscription/access';
import { countPlatformAccessSubscribers, fetchPlatformAccessProfiles } from '@/lib/subscription/subscribers';
import {
  getWinnerDisplayStatus,
  isWinningEntry,
} from '@/lib/winners/helpers';
import { getMonthKey } from '@/lib/utils';
import type {
  Charity,
  Draw,
  DrawEntry,
  GolfScore,
  Profile,
} from '@/types';

export type CharityWithContribution = {
  charity: Charity | null;
  monthlyContribution: number;
  lifetimeContribution: number;
  percentage: number;
};

export type WinningsSummary = {
  totalWon: number;
  totalPaid: number;
  pendingCount: number;
  entries: Array<{
    entry: DrawEntry;
    drawMonth: string;
    displayStatus: ReturnType<typeof getWinnerDisplayStatus>;
  }>;
};

export type NextDrawInfo = {
  month: string;
  label: string;
  subscriberCount: number;
  estimatedPool: number;
  rolloverAmount: number;
};

export type DashboardProfile = Profile & {
  renewalDate: string | null;
};

export async function getProfile(userId: string): Promise<DashboardProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  const renewalDate = await getRenewalDate(data.stripe_subscription_id);

  return {
    ...(data as Profile),
    renewalDate,
  };
}

export async function getRenewalDate(
  stripeSubscriptionId: string | null
): Promise<string | null> {
  if (!stripeSubscriptionId) return null;

  try {
    const { stripe } = await import('@/lib/stripe/server');
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const periodEnd = (subscription as { current_period_end?: number }).current_period_end;
    if (!periodEnd) return null;
    return new Date(periodEnd * 1000).toISOString();
  } catch {
    return null;
  }
}

export async function getScores(userId: string): Promise<GolfScore[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('golf_scores')
    .select('*')
    .eq('user_id', userId)
    .order('score_date', { ascending: false });

  if (error) return [];
  return (data ?? []) as GolfScore[];
}

export async function getCharityWithContribution(
  userId: string
): Promise<CharityWithContribution> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile) {
    return {
      charity: null,
      monthlyContribution: 0,
      lifetimeContribution: 0,
      percentage: 10,
    };
  }

  let charity: Charity | null = null;
  if (profile.charity_id) {
    const { data } = await supabase
      .from('charities')
      .select('*')
      .eq('id', profile.charity_id)
      .maybeSingle();
    charity = data as Charity | null;
  }

  const monthlyContribution = hasPlatformAccess(
    profile.subscription_status,
    profile.subscription_ends_at
  )
    ? calculateCharityContribution(
        profile.subscription_plan,
        profile.charity_percentage,
      )
    : 0;

  const monthsSubscribed = Math.max(
    1,
    differenceInMonths(new Date(), new Date(profile.created_at)) + 1,
  );

  return {
    charity: charity?.is_active === false ? null : charity,
    monthlyContribution,
    lifetimeContribution: hasPlatformAccess(
      profile.subscription_status,
      profile.subscription_ends_at
    )
      ? Math.round(monthlyContribution * monthsSubscribed * 100) / 100
      : 0,
    percentage: profile.charity_percentage,
  };
}

export async function getDrawHistory(userId: string): Promise<DrawWithMeta[]> {
  const supabase = await createClient();

  const { data: draws, error } = await supabase
    .from('draws')
    .select('*')
    .eq('status', 'published')
    .order('month', { ascending: false });

  if (error || !draws) return [];

  const enriched: DrawWithMeta[] = [];

  for (const draw of draws as Draw[]) {
    const { data: entry } = await supabase
      .from('draw_entries')
      .select('*')
      .eq('draw_id', draw.id)
      .eq('user_id', userId)
      .maybeSingle();

    enriched.push({ ...draw, my_entry: entry });
  }

  return enriched;
}

export async function getWinningsSummary(userId: string): Promise<WinningsSummary> {
  const supabase = await createClient();

  const { data: entries, error } = await supabase
    .from('draw_entries')
    .select('*')
    .eq('user_id', userId)
    .not('match_type', 'is', null)
    .gt('prize_amount', 0)
    .order('created_at', { ascending: false });

  if (error || !entries) {
    return { totalWon: 0, totalPaid: 0, pendingCount: 0, entries: [] };
  }

  const result: WinningsSummary['entries'] = [];
  let totalWon = 0;
  let totalPaid = 0;
  let pendingCount = 0;

  for (const entry of entries as DrawEntry[]) {
    if (!isWinningEntry(entry)) continue;

    const { data: draw } = await supabase
      .from('draws')
      .select('month')
      .eq('id', entry.draw_id)
      .maybeSingle();

    const prize = Number(entry.prize_amount);
    totalWon += prize;

    if (entry.payment_status === 'paid') totalPaid += prize;
    if (entry.payment_status === 'pending') pendingCount += 1;

    result.push({
      entry,
      drawMonth: (draw as Pick<Draw, 'month'> | null)?.month ?? 'Unknown',
      displayStatus: getWinnerDisplayStatus(entry),
    });
  }

  return {
    totalWon: Math.round(totalWon * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    pendingCount,
    entries: result,
  };
}

export async function getActiveSubscriberCount(): Promise<number> {
  return countPlatformAccessSubscribers();
}

export async function getNextDrawInfo(): Promise<NextDrawInfo> {
  const supabase = await createClient();
  const currentMonth = getMonthKey();
  const nextMonth = getNextMonthKey(currentMonth) ?? currentMonth;

  const { data: latestPublished } = await supabase
    .from('draws')
    .select('*')
    .eq('status', 'published')
    .order('month', { ascending: false })
    .limit(1)
    .maybeSingle();

  const upcomingMonth =
    latestPublished?.month === currentMonth ? nextMonth : currentMonth;

  const subscriberCount = await getActiveSubscriberCount();
  const rolloverAmount = await resolveRolloverForMonth(upcomingMonth);
  const profiles = await fetchPlatformAccessProfiles();

  const pools = calculatePrizePools({
    totalMonthlyPool: totalMonthlyPoolContribution(
      profiles.map((profile) => profile.subscription_plan)
    ),
    rolloverAmount,
  });

  const [year, monthNum] = upcomingMonth.split('-').map(Number);
  const label = new Date(year, monthNum - 1, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  return {
    month: upcomingMonth,
    label,
    subscriberCount,
    estimatedPool:
      Math.round((pools.jackpot + pools.pool4match + pools.pool3match) * 100) /
      100,
    rolloverAmount,
  };
}

export async function getPendingProofWinners(userId: string) {
  const winnings = await getWinningsSummary(userId);
  return winnings.entries.filter(
    ({ entry, displayStatus }) =>
      entry.payment_status === 'pending' ||
      displayStatus === 'rejected' ||
      displayStatus === 'pending'
  );
}
