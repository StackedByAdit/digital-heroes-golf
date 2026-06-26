import { createAdminClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import {
  normalizeCharityId,
  normalizeCharityPercentage,
  profileHasActiveSubscription,
  updateProfileSubscriptionFields,
} from '@/lib/stripe/profile-subscription-update';
import {
  planFromMetadata,
  planFromStripePrice,
  subscriptionPeriodEndIso,
} from '@/lib/stripe/subscription-sync';
import type { SubscriptionPlan } from '@/types';
import type Stripe from 'stripe';

export type ActivateCheckoutResult =
  | { ok: true; userId: string; plan: SubscriptionPlan | null }
  | {
      ok: false;
      reason:
        | 'missing_session'
        | 'session_mismatch'
        | 'payment_incomplete'
        | 'profile_update_failed'
        | 'session_invalid';
    };

function isCheckoutComplete(session: Stripe.Checkout.Session): boolean {
  if (session.status === 'complete') return true;

  return (
    session.payment_status === 'paid' ||
    session.payment_status === 'no_payment_required'
  );
}

export async function activateSubscriptionFromCheckoutSession(
  sessionId: string,
  userId: string,
): Promise<ActivateCheckoutResult> {
  try {
    if (await profileHasActiveSubscription(userId)) {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from('profiles')
        .select('subscription_plan')
        .eq('id', userId)
        .maybeSingle();

      return {
        ok: true,
        userId,
        plan: (profile?.subscription_plan as SubscriptionPlan | null) ?? null,
      };
    }

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

    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id ?? null;

    const admin = createAdminClient();
    const charityId = normalizeCharityId(session.metadata?.charityId);
    const charityPercentage = normalizeCharityPercentage(
      session.metadata?.charityPercentage,
    );

    const updateResult = await updateProfileSubscriptionFields(admin, userId, {
      subscription_status: 'active',
      subscription_plan: plan,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      subscription_ends_at: subscription
        ? subscriptionPeriodEndIso(subscription)
        : null,
      ...(charityId ? { charity_id: charityId } : {}),
      ...(charityPercentage !== undefined
        ? { charity_percentage: charityPercentage }
        : {}),
    });

    if (!updateResult.ok) {
      if (await profileHasActiveSubscription(userId)) {
        return { ok: true, userId, plan };
      }
      return { ok: false, reason: 'profile_update_failed' };
    }

    return { ok: true, userId, plan };
  } catch (error) {
    console.error('[activate subscription]', error);

    if (await profileHasActiveSubscription(userId)) {
      return { ok: true, userId, plan: null };
    }

    return { ok: false, reason: 'session_invalid' };
  }
}

export async function activateSubscriptionFromCheckoutSessionId(
  sessionId: string,
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
