import type { MatchType } from '@/types';

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

/**
 * Algorithmic draw mode: scores appearing more often in the subscriber pool
 * are more likely to be drawn. We build a frequency map, assign every value
 * 1–45 at least weight 1 (so sparse pools still produce five numbers), then
 * perform weighted sampling without replacement.
 */
export function generateAlgorithmicDraw(allUserScores: number[]): number[] {
  if (allUserScores.length === 0) {
    return generateRandomDraw();
  }

  const weights = new Map<number, number>();

  for (let value = MIN_SCORE; value <= MAX_SCORE; value++) {
    weights.set(value, 1);
  }

  for (const score of allUserScores) {
    if (score >= MIN_SCORE && score <= MAX_SCORE) {
      weights.set(score, (weights.get(score) ?? 0) + 1);
    }
  }

  const drawn = new Set<number>();

  while (drawn.size < DRAW_SIZE) {
    const candidates = [...weights.entries()].filter(([value]) => !drawn.has(value));
    const totalWeight = candidates.reduce((sum, [, weight]) => sum + weight, 0);
    let threshold = Math.random() * totalWeight;

    for (const [value, weight] of candidates) {
      threshold -= weight;
      if (threshold <= 0) {
        drawn.add(value);
        break;
      }
    }
  }

  return [...drawn].sort((a, b) => a - b);
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

/** Prize split: 40% jackpot, 35% four-match pool, 25% three-match pool. */
export function calculatePrizePools(params: {
  subscriberCount: number;
  monthlyFeePerUser: number;
  rolloverAmount: number;
}): {
  jackpot: number;
  pool4match: number;
  pool3match: number;
  totalPool: number;
} {
  const totalPool =
    params.subscriberCount * params.monthlyFeePerUser + params.rolloverAmount;

  return {
    totalPool,
    jackpot: roundCurrency(totalPool * 0.4),
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
