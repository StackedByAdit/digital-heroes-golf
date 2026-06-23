import { createAdminClient } from '@/lib/supabase/server';
import type { SubscriptionPlan, SubscriptionStatus } from '@/types';
import {
  mapStripeSubscriptionStatus,
  planFromMetadata,
  planFromStripePrice,
} from '@/lib/stripe/subscription-sync';
import type Stripe from 'stripe';
import {
  formatRetryDateFromInvoice,
  notifyPaymentFailedEmail,
  notifyWelcomeEmail,
} from '@/lib/email/notifications';

async function findProfileContactByCustomerId(customerId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Profile lookup failed: ${error.message}`);
  }

  return data;
}

async function findProfileByCustomerId(customerId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Profile lookup failed: ${error.message}`);
  }

  return data;
}

async function findProfileByUserId(userId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Profile lookup failed: ${error.message}`);
  }

  return data;
}

export async function syncProfileFromSubscription(
  subscription: Stripe.Subscription,
  overrides?: {
    charityId?: string;
    charityPercentage?: number;
    plan?: SubscriptionPlan;
    status?: SubscriptionStatus;
  }
) {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  const userId = subscription.metadata.userId;
  const profile = userId
    ? await findProfileByUserId(userId)
    : await findProfileByCustomerId(customerId);

  if (!profile) {
    console.warn('[stripe webhook] No profile for subscription', subscription.id);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const plan =
    overrides?.plan ??
    planFromMetadata(subscription.metadata.plan) ??
    planFromStripePrice(priceId);

  const status =
    overrides?.status ?? mapStripeSubscriptionStatus(subscription.status);

  const supabase = createAdminClient();
  const update: Record<string, unknown> = {
    subscription_status: status,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
  };

  if (plan) {
    update.subscription_plan = plan;
  }

  if (overrides?.charityId) {
    update.charity_id = overrides.charityId;
  }

  if (overrides?.charityPercentage !== undefined) {
    update.charity_percentage = overrides.charityPercentage;
  }

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', profile.id);

  if (error) {
    throw new Error(`Failed to sync profile: ${error.message}`);
  }
}

export async function updateProfileSubscriptionStatus(
  customerId: string,
  status: SubscriptionStatus,
  subscriptionId?: string | null
) {
  const profile = await findProfileByCustomerId(customerId);

  if (!profile) {
    console.warn('[stripe webhook] No profile for customer', customerId);
    return;
  }

  const supabase = createAdminClient();
  const update: Record<string, unknown> = { subscription_status: status };

  if (subscriptionId !== undefined) {
    update.stripe_subscription_id = subscriptionId;
  }

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', profile.id);

  if (error) {
    throw new Error(`Failed to update subscription status: ${error.message}`);
  }
}

export async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  await syncProfileFromSubscription(subscription, { status: 'active' });
  notifyWelcomeEmail(subscription).catch(console.error);
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const status = subscription.cancel_at_period_end
    ? 'cancelled'
    : mapStripeSubscriptionStatus(subscription.status);

  await syncProfileFromSubscription(subscription, { status });
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  await updateProfileSubscriptionStatus(customerId, 'inactive', null);
}

export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

  if (!customerId) return;

  console.info('[stripe webhook] Invoice payment succeeded', invoice.id);
  await updateProfileSubscriptionStatus(customerId, 'active');
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

  if (!customerId) return;

  console.warn('[stripe webhook] Invoice payment failed', invoice.id);
  await updateProfileSubscriptionStatus(customerId, 'past_due');

  const contact = await findProfileContactByCustomerId(customerId);
  if (contact?.email) {
    notifyPaymentFailedEmail({
      email: contact.email,
      name: contact.full_name,
      retryDate: formatRetryDateFromInvoice(invoice),
    });
  }
}
