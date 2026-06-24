import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import {
  countMatches,
  DEFAULT_MONTHLY_FEE,
  generateAlgorithmicDraw,
  generateRandomDraw,
  getMatchType,
  getNextMonthKey,
  getPreviousMonthKey,
  splitPrize,
} from '@/lib/drawEngine';
import type { Draw, DrawEntry, MatchType, Profile } from '@/types';

export type SubscriberWithScores = {
  profile: Pick<Profile, 'id' | 'email' | 'full_name'>;
  scores: number[];
};

export type SimulationResult = {
  draw_id: string;
  drawn_numbers: number[];
  summary: {
    total_subscribers: number;
    '5_match_winners': number;
    '4_match_winners': number;
    '3_match_winners': number;
    jackpot_rolls_over: boolean;
  };
  prize_breakdown: {
    jackpot: number;
    pool_4match: number;
    each_4match_winner: number;
    pool_3match: number;
    each_3match_winner: number;
    each_5match_winner: number;
  };
  entries: Array<{
    user_id: string;
    user_scores: number[];
    match_count: number;
    match_type: MatchType | null;
    prize_amount: number;
  }>;
};

export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: 'Unauthorized' as const, status: 401 as const };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return { supabase, user, profile, isAdmin: profile?.role === 'admin' };
}

export async function requireAdmin() {
  const auth = await requireAuth();
  if ('error' in auth) return auth;
  if (!auth.isAdmin) {
    return { error: 'Forbidden' as const, status: 403 as const };
  }
  return auth;
}

export async function fetchActiveSubscribersWithScores(): Promise<
  SubscriberWithScores[]
> {
  const admin = createAdminClient();

  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id, email, full_name')
    .eq('subscription_status', 'active');

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const subscribers: SubscriberWithScores[] = [];

  for (const profile of profiles ?? []) {
    const { data: scores, error: scoresError } = await admin
      .from('golf_scores')
      .select('score')
      .eq('user_id', profile.id)
      .order('score_date', { ascending: false })
      .limit(5);

    if (scoresError) {
      throw new Error(scoresError.message);
    }

    subscribers.push({
      profile,
      scores: (scores ?? []).map((row) => row.score),
    });
  }

  return subscribers;
}

export async function resolveRolloverForMonth(month: string): Promise<number> {
  const previousMonth = getPreviousMonthKey(month);
  if (!previousMonth) return 0;

  const admin = createAdminClient();

  const { data: previousDraw } = await admin
    .from('draws')
    .select('id, jackpot_amount')
    .eq('month', previousMonth)
    .eq('status', 'published')
    .maybeSingle();

  if (!previousDraw) return 0;

  const { count } = await admin
    .from('draw_entries')
    .select('id', { count: 'exact', head: true })
    .eq('draw_id', previousDraw.id)
    .eq('match_type', '5-match');

  if ((count ?? 0) > 0) return 0;

  return Number(previousDraw.jackpot_amount);
}

export function flattenScorePool(subscribers: SubscriberWithScores[]): number[] {
  return subscribers.flatMap((subscriber) => subscriber.scores);
}

export function eligibleDrawSubscribers(
  subscribers: SubscriberWithScores[],
): SubscriberWithScores[] {
  return subscribers.filter((subscriber) => subscriber.scores.length === 5);
}

export function buildSimulation(
  draw: Draw,
  subscribers: SubscriberWithScores[]
): SimulationResult {
  const winners5: SimulationResult['entries'] = [];
  const winners4: SimulationResult['entries'] = [];
  const winners3: SimulationResult['entries'] = [];

  const allEntries = subscribers.map((subscriber) => {
    const matchCount = countMatches(subscriber.scores, draw.drawn_numbers);
    const matchType = getMatchType(matchCount);

    const entry = {
      user_id: subscriber.profile.id,
      user_scores: subscriber.scores,
      match_count: matchCount,
      match_type: matchType,
      prize_amount: 0,
    };

    if (matchType === '5-match') winners5.push(entry);
    else if (matchType === '4-match') winners4.push(entry);
    else if (matchType === '3-match') winners3.push(entry);

    return entry;
  });

  const each5 = splitPrize(Number(draw.jackpot_amount), winners5.length);
  const each4 = splitPrize(Number(draw.pool_4match), winners4.length);
  const each3 = splitPrize(Number(draw.pool_3match), winners3.length);

  for (const entry of winners5) entry.prize_amount = each5;
  for (const entry of winners4) entry.prize_amount = each4;
  for (const entry of winners3) entry.prize_amount = each3;

  return {
    draw_id: draw.id,
    drawn_numbers: draw.drawn_numbers,
    summary: {
      total_subscribers: subscribers.length,
      '5_match_winners': winners5.length,
      '4_match_winners': winners4.length,
      '3_match_winners': winners3.length,
      jackpot_rolls_over: winners5.length === 0,
    },
    prize_breakdown: {
      jackpot: Number(draw.jackpot_amount),
      pool_4match: Number(draw.pool_4match),
      each_4match_winner: each4,
      pool_3match: Number(draw.pool_3match),
      each_3match_winner: each3,
      each_5match_winner: each5,
    },
    entries: allEntries,
  };
}

export async function applyJackpotRollover(draw: Draw, simulation: SimulationResult) {
  if (!simulation.summary.jackpot_rolls_over) return;

  const nextMonth = getNextMonthKey(draw.month);
  if (!nextMonth) return;

  const admin = createAdminClient();
  const { data: nextDraw } = await admin
    .from('draws')
    .select('id, rollover_amount, jackpot_amount')
    .eq('month', nextMonth)
    .maybeSingle();

  if (!nextDraw) return;

  const rolledJackpot = Number(draw.jackpot_amount);

  await admin
    .from('draws')
    .update({
      rollover_amount: Number(nextDraw.rollover_amount) + rolledJackpot,
      jackpot_amount: Number(nextDraw.jackpot_amount) + rolledJackpot,
    })
    .eq('id', nextDraw.id);
}

export function generateDrawNumbers(
  drawType: Draw['draw_type'],
  scorePool: number[]
): number[] {
  return drawType === 'algorithmic'
    ? generateAlgorithmicDraw(scorePool)
    : generateRandomDraw();
}

export async function countDrawWinners(drawId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('draw_entries')
    .select('match_type')
    .eq('draw_id', drawId)
    .not('match_type', 'is', null);

  const counts = { '5-match': 0, '4-match': 0, '3-match': 0 };
  for (const row of data ?? []) {
    if (row.match_type && row.match_type in counts) {
      counts[row.match_type as keyof typeof counts] += 1;
    }
  }

  return counts;
}

export type DrawWithMeta = Draw & {
  winner_counts?: { '5-match': number; '4-match': number; '3-match': number };
  my_entry?: DrawEntry | null;
};

export { DEFAULT_MONTHLY_FEE };
