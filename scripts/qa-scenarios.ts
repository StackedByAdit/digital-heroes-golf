/**
 * PRD QA scenario verification (run via npm run test:qa)
 *
 * SCENARIO: Prize pool calculation
 * Given: 120 active subscribers at £10/month, previous jackpot rollover £480
 * Expected: totalPool = £1200, jackpot = £960, pool4 = £420, pool3 = £300
 */
import {
  calculatePrizePools,
  countMatches,
  getMatchType,
} from '../src/lib/drawEngine';

function assertEqual(actual: number, expected: number, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function assertMatchType(
  drawn: number[],
  userScores: number[],
  expectedCount: number,
  expectedType: ReturnType<typeof getMatchType>,
) {
  const count = countMatches(userScores, drawn);
  const type = getMatchType(count);
  if (count !== expectedCount || type !== expectedType) {
    throw new Error(
      `Draw matching failed: expected ${expectedCount}/${expectedType}, got ${count}/${type}`,
    );
  }
}

const pools = calculatePrizePools({
  subscriberCount: 120,
  monthlyFeePerUser: 10,
  rolloverAmount: 480,
});

assertEqual(pools.totalPool, 1200, 'totalPool');
assertEqual(pools.jackpot, 960, 'jackpot');
assertEqual(pools.pool4match, 420, 'pool4match');
assertEqual(pools.pool3match, 300, 'pool3match');

/**
 * SCENARIO: Draw matching
 * Given: drawn = [7, 12, 19, 28, 34], user scores = [7, 12, 19, 33, 40]
 * Expected: matchCount = 3, matchType = '3-match'
 */
assertMatchType([7, 12, 19, 28, 34], [7, 12, 19, 33, 40], 3, '3-match');

console.log('All PRD QA scenarios passed.');
