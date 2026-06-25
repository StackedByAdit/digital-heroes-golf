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
  totalMonthlyPoolContribution,
} from '../src/lib/drawEngine';
import {
  hasPlatformAccess,
  isDrawEligible,
  REQUIRED_SCORE_COUNT,
} from '../src/lib/subscription/access';

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

const planWeighted = totalMonthlyPoolContribution(
  Array.from({ length: 119 }, () => 'monthly' as const).concat('yearly')
);
const planPools = calculatePrizePools({
  totalMonthlyPool: planWeighted,
  rolloverAmount: 480,
});
assertEqual(planPools.totalPool, 1198.33, 'plan-weighted totalPool');
assertEqual(planPools.jackpot, 959.33, 'plan-weighted jackpot');
console.log('✓ Plan-weighted prize pool scenario');

/**
 * SCENARIO: Draw matching
 * Given: drawn = [7, 12, 19, 28, 34], user scores = [7, 12, 19, 33, 40]
 * Expected: matchCount = 3, matchType = '3-match'
 */
assertMatchType([7, 12, 19, 28, 34], [7, 12, 19, 33, 40], 3, '3-match');

/**
 * SCENARIO: Subscription access rules
 */
const futureEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const pastEnd = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

if (!hasPlatformAccess('active')) {
  throw new Error('active should grant platform access');
}
if (!hasPlatformAccess('past_due')) {
  throw new Error('past_due should grant platform access during retry');
}
if (!hasPlatformAccess('cancelled', futureEnd)) {
  throw new Error('cancelled with future end date should grant access');
}
if (hasPlatformAccess('cancelled', pastEnd)) {
  throw new Error('cancelled after period end should not grant access');
}
if (hasPlatformAccess('inactive')) {
  throw new Error('inactive should not grant platform access');
}

/**
 * SCENARIO: Draw eligibility requires 5 scores
 */
if (!isDrawEligible('active', REQUIRED_SCORE_COUNT)) {
  throw new Error('active subscriber with 5 scores should be draw eligible');
}
if (isDrawEligible('active', REQUIRED_SCORE_COUNT - 1)) {
  throw new Error('subscriber with fewer than 5 scores should not be draw eligible');
}
if (isDrawEligible('inactive', REQUIRED_SCORE_COUNT)) {
  throw new Error('inactive subscriber should not be draw eligible');
}

console.log('All PRD QA scenarios passed.');
