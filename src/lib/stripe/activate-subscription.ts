import { createAdminClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import {
  planFromMetadata,
  planFromStripePrice,
  subscriptionPeriodEndIso,
} from '@/lib/stripe/subscription-sync';
import type { SubscriptionPlan } from '@/types';
import type Stripe from 'stripe';

export type ActivateCheckoutResult =
  | { ok: true; userId: string; plan: SubscriptionPlan | null }
  | { ok: false; reason: 'missing_session' | 'session_mismatch' | 'payment_incomplete' | 'profile_update_failed' | 'session_invalid' };

function isCheckoutComplete(session: Stripe.Checkout.Session): boolean {
  if (session.status === 'complete') return true;

  return (
    session.payment_status === 'paid' ||
    session.payment_status === 'no_payment_required'
  );
}

export async function activateSubscriptionFromCheckoutSession(
  sessionId: string,
  userId: string
): Promise<ActivateCheckoutResult> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (session.metadata?.userId !== userId) {
      return { ok: false, reason: 'session_mismatch' };
    }

    if (!isCheckoutComplete(session)) {
      return { ok: false, reason: 'payment_incomplete' };
    }

    const subscription =
      typeof session.subscription === 'string'
        ? await stripe.subscriptions.retrieve(session.subscription)
        : session.subscription;

    const subscriptionId = subscription?.id ?? null;
    const priceId = subscription?.items.data[0]?.price.id;

    const plan =
      planFromMetadata(session.metadata?.plan) ??
      planFromStripePrice(priceId) ??
      null;

    const charityId = session.metadata?.charityId ?? null;
    const charityPercentageRaw = session.metadata?.charityPercentage;
    const charityPercentage = charityPercentageRaw
      ? Number(charityPercentageRaw)
      : undefined;

    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id ?? null;

    const admin = createAdminClient();
    const update: Record<string, unknown> = {
      subscription_status: 'active',
      subscription_plan: plan,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      charity_id: charityId,
      subscription_ends_at: subscription ? subscriptionPeriodEndIso(subscription) : null,
    };

    if (
      charityPercentage !== undefined &&
      !Number.isNaN(charityPercentage) &&
      charityPercentage >= 10 &&
      charityPercentage <= 100
    ) {
      update.charity_percentage = charityPercentage;
    }

    const { error } = await admin.from('profiles').update(update).eq('id', userId);

    if (error) {
      console.error('[activate subscription]', error);
      return { ok: false, reason: 'profile_update_failed' };
    }

    return { ok: true, userId, plan };
  } catch (error) {
    console.error('[activate subscription]', error);
    return { ok: false, reason: 'session_invalid' };
  }
}

export async function activateSubscriptionFromCheckoutSessionId(
  sessionId: string
): Promise<ActivateCheckoutResult> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  });

  const userId = session.metadata?.userId;
  if (!userId) {
    return { ok: false, reason: 'session_invalid' };
  }

  return activateSubscriptionFromCheckoutSession(sessionId, userId);
}
