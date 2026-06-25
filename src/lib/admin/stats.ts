import { differenceInMonths, startOfMonth } from 'date-fns';
import {
  calculateCharityContribution,
  SUBSCRIPTION_MONTHLY_GBP,
  SUBSCRIPTION_YEARLY_GBP,
} from '@/lib/charity/helpers';
import {
  calculatePrizePools,
  totalMonthlyPoolContribution,
} from '@/lib/drawEngine';
import { createAdminClient } from '@/lib/supabase/server';
import { hasPlatformAccess } from '@/lib/subscription/access';
import { getMonthKey } from '@/lib/utils';
import type { Draw, Profile } from '@/types';

export type CharityBreakdown = {
  charity_name: string;
  subscriber_count: number;
  total_contributions: number;
};

export type AdminStats = {
  total_users: number;
  active_subscribers: number;
  inactive_subscribers: number;
  monthly_subscribers: number;
  yearly_subscribers: number;
  total_prize_pool_this_month: number;
  total_prize_paid: number;
  total_charity_contributions: number;
  pending_winners: number;
  draws_this_year: number;
  charities_breakdown: CharityBreakdown[];
  mrr: number;
  churn_rate: number;
  win_rates: Array<{
    tier: string;
    winners: number;
    entries: number;
    rate: number;
  }>;
  average_prize: number;
  rollover_history: Array<{ month: string; amount: number }>;
  current_rollover: number;
};

function monthsSubscribed(createdAt: string): number {
  return Math.max(
    1,
    differenceInMonths(new Date(), new Date(createdAt)) + 1
  );
}

export async function getAdminStats(): Promise<AdminStats> {
  const admin = createAdminClient();
  const currentMonth = getMonthKey();
  const currentYear = new Date().getFullYear().toString();

  const { data: profiles } = await admin.from('profiles').select('*');
  const allProfiles = (profiles ?? []) as Profile[];

  const activeProfiles = allProfiles.filter((profile) =>
    hasPlatformAccess(profile.subscription_status, profile.subscription_ends_at)
  );
  const monthlySubscribers = activeProfiles.filter(
    (profile) => profile.subscription_plan === 'monthly'
  ).length;
  const yearlySubscribers = activeProfiles.filter(
    (profile) => profile.subscription_plan === 'yearly'
  ).length;

  const mrr =
    monthlySubscribers * SUBSCRIPTION_MONTHLY_GBP +
    yearlySubscribers * (SUBSCRIPTION_YEARLY_GBP / 12);

  const cancelledThisMonth = allProfiles.filter((profile) => {
    if (profile.subscription_status !== 'cancelled') return false;
    const updated = new Date(profile.updated_at);
    return updated >= startOfMonth(new Date());
  }).length;

  const churnDenominator = activeProfiles.length + cancelledThisMonth;
  const churnRate =
    churnDenominator > 0
      ? Math.round((cancelledThisMonth / churnDenominator) * 1000) / 10
      : 0;

  const { data: charities } = await admin
    .from('charities')
    .select('id, name');

  const charityNameById = new Map(
    (charities ?? []).map((charity) => [charity.id, charity.name as string])
  );

  const charityMap = new Map<string, CharityBreakdown>();

  let totalCharityContributions = 0;

  for (const profile of allProfiles) {
    if (
      !profile.charity_id ||
      !hasPlatformAccess(profile.subscription_status, profile.subscription_ends_at)
    ) {
      continue;
    }

    const monthly = calculateCharityContribution(
      profile.subscription_plan,
      profile.charity_percentage
    );
    const lifetime = monthly * monthsSubscribed(profile.created_at);
    totalCharityContributions += lifetime;

    const charityName =
      charityNameById.get(profile.charity_id) ?? 'Unknown charity';
    const existing = charityMap.get(profile.charity_id) ?? {
      charity_name: charityName,
      subscriber_count: 0,
      total_contributions: 0,
    };

    existing.subscriber_count += 1;
    existing.total_contributions += lifetime;
    charityMap.set(profile.charity_id, existing);
  }

  const { data: draws } = await admin
    .from('draws')
    .select('*')
    .order('month', { ascending: false });

  const allDraws = (draws ?? []) as Draw[];
  const currentMonthDraw = allDraws.find((draw) => draw.month === currentMonth);
  const latestPublished = allDraws.find((draw) => draw.status === 'published');

  const rolloverAmount = currentMonthDraw
    ? Number(currentMonthDraw.rollover_amount)
    : latestPublished
      ? Number(latestPublished.rollover_amount)
      : 0;

  const prizePools = calculatePrizePools({
    totalMonthlyPool: totalMonthlyPoolContribution(
      activeProfiles.map((profile) => profile.subscription_plan)
    ),
    rolloverAmount,
  });

  const drawsThisYear = allDraws.filter(
    (draw) => draw.month.startsWith(currentYear) && draw.status === 'published'
  ).length;

  const { data: pendingEntries } = await admin
    .from('draw_entries')
    .select('id, payment_status, proof_url')
    .not('match_type', 'is', null)
    .gt('prize_amount', 0)
    .in('payment_status', ['pending', 'rejected']);

  const pendingWinners =
    pendingEntries?.filter(
      (entry) =>
        entry.payment_status === 'pending' ||
        (entry.payment_status === 'rejected' && !entry.proof_url)
    ).length ?? 0;

  const { data: publishedDrawIds } = await admin
    .from('draws')
    .select('id')
    .eq('status', 'published');

  const publishedIds = (publishedDrawIds ?? []).map((draw) => draw.id);

  let totalEntries = 0;
  let winners3 = 0;
  let winners4 = 0;
  let winners5 = 0;
  let totalPrizePaid = 0;
  let winnerCount = 0;

  if (publishedIds.length > 0) {
    const { data: entries } = await admin
      .from('draw_entries')
      .select('match_type, prize_amount, payment_status')
      .in('draw_id', publishedIds);

    for (const entry of entries ?? []) {
      totalEntries += 1;
      if (entry.match_type === '3-match') winners3 += 1;
      if (entry.match_type === '4-match') winners4 += 1;
      if (entry.match_type === '5-match') winners5 += 1;
      if (entry.match_type && Number(entry.prize_amount) > 0) {
        winnerCount += 1;
        if (entry.payment_status === 'paid') {
          totalPrizePaid += Number(entry.prize_amount);
        }
      }
    }
  }

  const winRates = [
    {
      tier: '3-match',
      winners: winners3,
      entries: totalEntries,
      rate: totalEntries ? Math.round((winners3 / totalEntries) * 1000) / 10 : 0,
    },
    {
      tier: '4-match',
      winners: winners4,
      entries: totalEntries,
      rate: totalEntries ? Math.round((winners4 / totalEntries) * 1000) / 10 : 0,
    },
    {
      tier: '5-match',
      winners: winners5,
      entries: totalEntries,
      rate: totalEntries ? Math.round((winners5 / totalEntries) * 1000) / 10 : 0,
    },
  ];

  const rolloverHistory = allDraws
    .filter((draw) => draw.status === 'published')
    .slice(0, 12)
    .map((draw) => ({
      month: draw.month,
      amount: Number(draw.rollover_amount),
    }))
    .reverse();

  const currentRollover = latestPublished
    ? Number(latestPublished.rollover_amount)
    : 0;

  return {
    total_users: allProfiles.length,
    active_subscribers: activeProfiles.length,
    inactive_subscribers: allProfiles.length - activeProfiles.length,
    monthly_subscribers: monthlySubscribers,
    yearly_subscribers: yearlySubscribers,
    total_prize_pool_this_month: prizePools.totalPool,
    total_prize_paid: Math.round(totalPrizePaid * 100) / 100,
    total_charity_contributions:
      Math.round(totalCharityContributions * 100) / 100,
    pending_winners: pendingWinners,
    draws_this_year: drawsThisYear,
    charities_breakdown: [...charityMap.values()].sort(
      (a, b) => b.subscriber_count - a.subscriber_count
    ),
    mrr: Math.round(mrr * 100) / 100,
    churn_rate: churnRate,
    win_rates: winRates,
    average_prize:
      winnerCount > 0
        ? Math.round((totalPrizePaid / winnerCount) * 100) / 100
        : 0,
    rollover_history: rolloverHistory,
    current_rollover: currentRollover,
  };
}
