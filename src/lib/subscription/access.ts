import type { SubscriptionStatus } from '@/types';

/** Stableford scores required for monthly draw entry. */
export const REQUIRED_SCORE_COUNT = 5;

/**
 * Subscription states that grant platform access (scores, draws, charity).
 * - active: paid and current
 * - past_due: payment retry in progress (Stripe grace period)
 * - cancelled: scheduled cancellation — access until subscription_ends_at
 */
export function hasPlatformAccess(
  status: SubscriptionStatus | string | null | undefined,
  subscriptionEndsAt?: string | null
): boolean {
  if (!status) return false;

  if (status === 'active' || status === 'past_due') {
    return true;
  }

  if (status === 'cancelled') {
    if (!subscriptionEndsAt) return true;
    return new Date(subscriptionEndsAt).getTime() > Date.now();
  }

  return false;
}

export function isDrawEligible(
  status: SubscriptionStatus | string | null | undefined,
  scoreCount: number,
  subscriptionEndsAt?: string | null
): boolean {
  return (
    hasPlatformAccess(status, subscriptionEndsAt) &&
    scoreCount >= REQUIRED_SCORE_COUNT
  );
}

export function scoresProgressLabel(scoreCount: number): string {
  return `${Math.min(scoreCount, REQUIRED_SCORE_COUNT)}/${REQUIRED_SCORE_COUNT} scores`;
}
