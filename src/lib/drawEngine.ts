import type { DrawType, MatchType, SubscriptionPlan } from '@/types';
import {
  SUBSCRIPTION_MONTHLY_GBP,
  SUBSCRIPTION_YEARLY_GBP,
} from '@/lib/charity/helpers';

const MIN_SCORE = 1;
const MAX_SCORE = 45;
const DRAW_SIZE = 5;

/**
 * Random draw mode: uniform selection without replacement from 1–45.
 * Each number has equal probability; order is not meaningful for matching.
 */
export function generateRandomDraw(): number[] {
  const pool = Array.from({ length: MAX_SCORE - MIN_SCORE + 1 }, (_, index) => index + MIN_SCORE);
  const drawn: number[] = [];

  while (drawn.length < DRAW_SIZE) {
    const index = Math.floor(Math.random() * pool.length);
    drawn.push(pool[index]);
    pool.splice(index, 1);
  }

  return drawn.sort((a, b) => a - b);
}

export function effectiveMonthlySubscriptionFee(
  plan: SubscriptionPlan | null
): number {
  if (plan === 'yearly') {
    return SUBSCRIPTION_YEARLY_GBP / 12;
  }
  return SUBSCRIPTION_MONTHLY_GBP;
}

export function totalMonthlyPoolContribution(
  plans: Array<SubscriptionPlan | null>
): number {
  return roundCurrency(
    plans.reduce((sum, plan) => sum + effectiveMonthlySubscriptionFee(plan), 0)
  );
}

function weightedDrawFromPool(
  weights: Map<number, number>,
  drawSize: number = DRAW_SIZE
): number[] {
  const drawn = new Set<number>();

  while (drawn.size < drawSize) {
    const candidates = [...weights.entries()].filter(([value]) => !drawn.has(value));
    const totalWeight = candidates.reduce((sum, [, weight]) => sum + weight, 0);
    let threshold = Math.random() * totalWeight;
    let selected: number | null = null;

    for (const [value, weight] of candidates) {
      threshold -= weight;
      if (threshold <= 0) {
        selected = value;
        break;
      }
    }

    if (selected === null && candidates.length > 0) {
      selected = candidates[candidates.length - 1][0];
    }

    if (selected !== null) {
      drawn.add(selected);
    }
  }

  return [...drawn].sort((a, b) => a - b);
}

function baseScoreWeights(allUserScores: number[]): Map<number, number> {
  const frequencies = new Map<number, number>();

  for (let value = MIN_SCORE; value <= MAX_SCORE; value++) {
    frequencies.set(value, 0);
  }

  for (const score of allUserScores) {
    if (score >= MIN_SCORE && score <= MAX_SCORE) {
      frequencies.set(score, (frequencies.get(score) ?? 0) + 1);
    }
  }

  return frequencies;
}

/**
 * Algorithmic draw mode: scores appearing more often in the subscriber pool
 * are more likely to be drawn.
 */
export function generateAlgorithmicDraw(allUserScores: number[]): number[] {
  if (allUserScores.length === 0) {
    return generateRandomDraw();
  }

  const frequencies = baseScoreWeights(allUserScores);
  const weights = new Map<number, number>();

  for (let value = MIN_SCORE; value <= MAX_SCORE; value++) {
    weights.set(value, (frequencies.get(value) ?? 0) + 1);
  }

  return weightedDrawFromPool(weights);
}

/**
 * Algorithmic (least frequent): rare scores in the pool are more likely to be drawn.
 */
export function generateAlgorithmicLeastDraw(allUserScores: number[]): number[] {
  if (allUserScores.length === 0) {
    return generateRandomDraw();
  }

  const frequencies = baseScoreWeights(allUserScores);
  const maxFrequency = Math.max(...frequencies.values(), 1);
  const weights = new Map<number, number>();

  for (let value = MIN_SCORE; value <= MAX_SCORE; value++) {
    const frequency = frequencies.get(value) ?? 0;
    // In-pool scores: rare scores weigh more. Scores never submitted stay at baseline 1.
    weights.set(
      value,
      frequency > 0 ? maxFrequency - frequency + 1 : 1
    );
  }

  return weightedDrawFromPool(weights);
}

/**
 * Count how many of the user's score values appear in the drawn set.
 * Each stored score is evaluated independently (matches DB run_draw logic).
 */
export function countMatches(userScores: number[], drawnNumbers: number[]): number {
  const drawnSet = new Set(drawnNumbers);
  return userScores.filter((score) => drawnSet.has(score)).length;
}

export function getMatchType(matchCount: number): MatchType | null {
  if (matchCount >= 5) return '5-match';
  if (matchCount === 4) return '4-match';
  if (matchCount === 3) return '3-match';
  return null;
}

/**
 * Prize split: 40% jackpot, 35% four-match pool, 25% three-match pool.
 * Rollover from a prior month with no 5-match winner is added to the jackpot only.
 */
export function calculatePrizePools(params: {
  subscriberCount?: number;
  monthlyFeePerUser?: number;
  totalMonthlyPool?: number;
  rolloverAmount: number;
}): {
  jackpot: number;
  pool4match: number;
  pool3match: number;
  totalPool: number;
} {
  const totalPool =
    params.totalMonthlyPool ??
    (params.subscriberCount ?? 0) * (params.monthlyFeePerUser ?? DEFAULT_MONTHLY_FEE);
  const monthlyJackpot = totalPool * 0.4;

  return {
    totalPool: roundCurrency(totalPool),
    jackpot: roundCurrency(monthlyJackpot + params.rolloverAmount),
    pool4match: roundCurrency(totalPool * 0.35),
    pool3match: roundCurrency(totalPool * 0.25),
  };
}

export function splitPrize(totalPrize: number, winnerCount: number): number {
  if (winnerCount <= 0) return 0;
  return roundCurrency(totalPrize / winnerCount);
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export const DEFAULT_MONTHLY_FEE = 10;

export function getPreviousMonthKey(month: string): string | null {
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const date = new Date(Date.UTC(year, monthIndex, 1));
  date.setUTCMonth(date.getUTCMonth() - 1);

  const prevYear = date.getUTCFullYear();
  const prevMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${prevYear}-${prevMonth}`;
}

export function getNextMonthKey(month: string): string | null {
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const date = new Date(Date.UTC(year, monthIndex, 1));
  date.setUTCMonth(date.getUTCMonth() + 1);

  const nextYear = date.getUTCFullYear();
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${nextYear}-${nextMonth}`;
}

const DRAW_TYPE_ORDER: DrawType[] = [
  'random',
  'algorithmic',
  'algorithmic_least',
];

export function drawTypeLabel(drawType: DrawType): string {
  switch (drawType) {
    case 'algorithmic':
      return 'Algorithmic (most frequent)';
    case 'algorithmic_least':
      return 'Algorithmic (least frequent)';
    default:
      return 'Random';
  }
}

export function nextDrawType(drawType: DrawType): DrawType {
  const index = DRAW_TYPE_ORDER.indexOf(drawType);
  return DRAW_TYPE_ORDER[(index + 1) % DRAW_TYPE_ORDER.length];
}

export function generateDrawNumbersForType(
  drawType: DrawType,
  scorePool: number[]
): number[] {
  switch (drawType) {
    case 'algorithmic':
      return generateAlgorithmicDraw(scorePool);
    case 'algorithmic_least':
      return generateAlgorithmicLeastDraw(scorePool);
    default:
      return generateRandomDraw();
  }
}
