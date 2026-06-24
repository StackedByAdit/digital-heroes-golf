import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';

let stripeClient: Stripe | undefined;

function createStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  return new Stripe(secretKey, {
    // Pinned per project requirements; SDK types target a newer default.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiVersion: '2024-04-10' as any,
    typescript: true,
  });
}

/** Lazily initialized Stripe server client */
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!stripeClient) {
      stripeClient = createStripeClient();
    }

    const value = Reflect.get(stripeClient, prop, stripeClient);
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(stripeClient)
      : value;
  },
});

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string
): Promise<string> {
  const supabase = createAdminClient();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profileError) {
    throw new Error(`Failed to load profile: ${profileError.message}`);
  }

  if (profile.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  });

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Failed to save Stripe customer: ${updateError.message}`);
  }

  return customer.id;
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}
