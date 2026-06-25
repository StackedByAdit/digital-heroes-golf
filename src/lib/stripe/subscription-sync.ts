import type Stripe from 'stripe';
import type { SubscriptionPlan, SubscriptionStatus } from '@/types';

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status
): SubscriptionStatus {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
      return 'cancelled';
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
    default:
      return 'inactive';
  }
}

export function subscriptionPeriodEndIso(
  subscription: Stripe.Subscription
): string | null {
  const periodEnd = (subscription as { current_period_end?: number })
    .current_period_end;
  if (!periodEnd) return null;
  return new Date(periodEnd * 1000).toISOString();
}

export function resolveProfileSubscriptionStatus(
  subscription: Stripe.Subscription
): SubscriptionStatus {
  if (
    subscription.cancel_at_period_end &&
    (subscription.status === 'active' || subscription.status === 'trialing')
  ) {
    return 'cancelled';
  }

  return mapStripeSubscriptionStatus(subscription.status);
}

export function planFromStripePrice(
  priceId: string | undefined
): SubscriptionPlan | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_MONTHLY_PRICE_ID) return 'monthly';
  if (priceId === process.env.STRIPE_YEARLY_PRICE_ID) return 'yearly';
  return null;
}

export function planFromMetadata(plan: string | undefined): SubscriptionPlan | null {
  if (plan === 'monthly' || plan === 'yearly') return plan;
  return null;
}
