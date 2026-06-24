/**
 * Draw engine + simulation unit tests (no server required).
 * Run: npx tsx scripts/test-draw-engine.ts
 */
import {
  calculatePrizePools,
  countMatches,
  generateAlgorithmicDraw,
  generateRandomDraw,
  getMatchType,
  splitPrize,
} from '../src/lib/drawEngine';
import {
  buildSimulation,
  eligibleDrawSubscribers,
  generateDrawNumbers,
  type SubscriberWithScores,
} from '../src/lib/draw/processing';
import type { Draw } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function isValidDraw(numbers: number[]): boolean {
  if (numbers.length !== 5) return false;
  const set = new Set(numbers);
  if (set.size !== 5) return false;
  return numbers.every((n) => n >= 1 && n <= 45);
}

// --- Random draw ---
for (let i = 0; i < 50; i++) {
  const drawn = generateRandomDraw();
  assert(isValidDraw(drawn), `random draw invalid: ${drawn.join(',')}`);
}
console.log('✓ Random draw produces 5 unique numbers in 1–45');

// --- Algorithmic draw ---
const biasedPool = Array(100).fill(7).concat(Array(100).fill(12));
let sevenCount = 0;
let twelveCount = 0;
const trials = 200;
for (let i = 0; i < trials; i++) {
  const drawn = generateAlgorithmicDraw(biasedPool);
  assert(isValidDraw(drawn), `algorithmic draw invalid: ${drawn.join(',')}`);
  if (drawn.includes(7)) sevenCount += 1;
  if (drawn.includes(12)) twelveCount += 1;
}
assert(
  sevenCount > trials * 0.5 && twelveCount > trials * 0.5,
  `algorithmic draw should favour frequent scores (7: ${sevenCount}, 12: ${twelveCount} of ${trials})`
);
console.log('✓ Algorithmic draw favours high-frequency scores');

assert(
  isValidDraw(generateAlgorithmicDraw([])),
  'algorithmic with empty pool falls back to random'
);
console.log('✓ Algorithmic empty pool falls back to random');

// --- generateDrawNumbers routing ---
const randomNums = generateDrawNumbers('random', [7, 7, 7]);
const algoNums = generateDrawNumbers('algorithmic', biasedPool);
assert(isValidDraw(randomNums), 'generateDrawNumbers random invalid');
assert(isValidDraw(algoNums), 'generateDrawNumbers algorithmic invalid');
console.log('✓ generateDrawNumbers routes by draw_type');

// --- Prize pools ---
const pools = calculatePrizePools({
  subscriberCount: 100,
  monthlyFeePerUser: 10,
  rolloverAmount: 400,
});
assertEqual(pools.totalPool, 1000, 'totalPool');
assertEqual(pools.jackpot, 800, 'jackpot with rollover');
assertEqual(pools.pool4match, 350, 'pool4match');
assertEqual(pools.pool3match, 250, 'pool3match');
console.log('✓ Prize pool calculation');

assertEqual(splitPrize(350, 3), 116.67, 'splitPrize 4-match');
assertEqual(splitPrize(250, 2), 125, 'splitPrize 3-match');
console.log('✓ Prize split');

// --- Match counting ---
assertEqual(countMatches([7, 12, 19, 33, 40], [7, 12, 19, 28, 34]), 3, 'match count');
assertEqual(getMatchType(3), '3-match', 'match type 3');
assertEqual(getMatchType(5), '5-match', 'match type 5');
console.log('✓ Match counting');

// --- buildSimulation ---
const mockDraw: Draw = {
  id: 'test-draw',
  month: '2099-01',
  draw_type: 'random',
  drawn_numbers: [7, 12, 19, 28, 34],
  status: 'draft',
  jackpot_amount: 400,
  pool_4match: 350,
  pool_3match: 250,
  rollover_amount: 0,
  published_at: null,
  created_at: new Date().toISOString(),
};

const subscribers: SubscriberWithScores[] = [
  {
    profile: { id: 'u1', email: 'a@test.com', full_name: 'Alice' },
    scores: [7, 12, 19, 33, 40], // 3-match
  },
  {
    profile: { id: 'u2', email: 'b@test.com', full_name: 'Bob' },
    scores: [7, 12, 19, 28, 34], // 5-match
  },
  {
    profile: { id: 'u3', email: 'c@test.com', full_name: 'Carol' },
    scores: [7, 12, 19, 28, 99], // 4-match
  },
  {
    profile: { id: 'u4', email: 'd@test.com', full_name: 'Dave' },
    scores: [10, 11, 13, 14, 15], // no match
  },
];

const eligible = eligibleDrawSubscribers(subscribers);
assertEqual(eligible.length, 4, 'eligible subscribers with 5 scores');

const sim = buildSimulation(mockDraw, eligible);
assertEqual(sim.summary['5_match_winners'], 1, '5-match winners');
assertEqual(sim.summary['4_match_winners'], 1, '4-match winners');
assertEqual(sim.summary['3_match_winners'], 1, '3-match winners');
assertEqual(sim.summary.jackpot_rolls_over, false, 'jackpot rolls over false');
assertEqual(sim.prize_breakdown.each_5match_winner, 400, 'jackpot winner prize');
assertEqual(sim.prize_breakdown.each_4match_winner, 350, '4-match winner prize');
assertEqual(sim.prize_breakdown.each_3match_winner, 250, '3-match winner prize');
assertEqual(sim.entries.length, 4, 'all eligible entries');
assertEqual(sim.entries.filter((e) => e.prize_amount > 0).length, 3, 'winners with prizes');
console.log('✓ buildSimulation prize breakdown');

const noJackpotDraw = { ...mockDraw, drawn_numbers: [1, 2, 3, 4, 5] as number[] };
const noJackpotSim = buildSimulation(noJackpotDraw, eligible);
assertEqual(noJackpotSim.summary['5_match_winners'], 0, 'no 5-match');
assertEqual(noJackpotSim.summary.jackpot_rolls_over, true, 'jackpot rolls over true');
console.log('✓ buildSimulation rollover flag');

console.log('\nAll draw engine tests passed.');
