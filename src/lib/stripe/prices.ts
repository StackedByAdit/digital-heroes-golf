import type { SubscriptionPlan } from '@/types';
import {
  SUBSCRIPTION_MONTHLY_GBP,
  SUBSCRIPTION_YEARLY_GBP,
} from '@/lib/charity/helpers';
import { stripe } from '@/lib/stripe/server';

const LOOKUP_KEYS: Record<SubscriptionPlan, string> = {
  monthly: 'dhg_monthly_gbp',
  yearly: 'dhg_yearly_gbp',
};

const PRODUCT_NAME = 'Digital Heroes Golf Membership';

export class StripePriceConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StripePriceConfigError';
  }
}

export function getStripePriceIdFromEnv(plan: SubscriptionPlan): string | undefined {
  return plan === 'monthly'
    ? process.env.STRIPE_MONTHLY_PRICE_ID?.trim()
    : process.env.STRIPE_YEARLY_PRICE_ID?.trim();
}

async function findPriceByLookupKey(lookupKey: string): Promise<string | null> {
  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });

  return prices.data[0]?.id ?? null;
}

async function findOrCreateProductId(): Promise<string> {
  const existing = await stripe.products.search({
    query: `name:'${PRODUCT_NAME}'`,
    limit: 1,
  });

  if (existing.data[0]) {
    return existing.data[0].id;
  }

  const product = await stripe.products.create({
    name: PRODUCT_NAME,
    description: 'Golf subscription with monthly prize draws and charity giving.',
    metadata: { app: 'digital-heroes-golf' },
  });

  return product.id;
}

async function createPrice(
  plan: SubscriptionPlan,
  productId: string
): Promise<string> {
  const lookupKey = LOOKUP_KEYS[plan];
  const unitAmount =
    plan === 'monthly'
      ? SUBSCRIPTION_MONTHLY_GBP * 100
      : SUBSCRIPTION_YEARLY_GBP * 100;

  const price = await stripe.prices.create({
    product: productId,
    currency: 'gbp',
    unit_amount: unitAmount,
    lookup_key: lookupKey,
    transfer_lookup_key: true,
    ...(plan === 'monthly'
      ? { recurring: { interval: 'month' } }
      : { recurring: { interval: 'year' } }),
    metadata: { plan, app: 'digital-heroes-golf' },
  });

  return price.id;
}

/** Resolves a Stripe price id from env vars, or by lookup key / auto-create in development. */
export async function resolveStripePriceId(
  plan: SubscriptionPlan
): Promise<string> {
  const fromEnv = getStripePriceIdFromEnv(plan);
  if (fromEnv) return fromEnv;

  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    throw new StripePriceConfigError(
      'Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local (Stripe Dashboard → Developers → API keys), then run `npm run stripe:setup`.'
    );
  }

  const lookupKey = LOOKUP_KEYS[plan];
  const existing = await findPriceByLookupKey(lookupKey);
  if (existing) return existing;

  if (process.env.NODE_ENV === 'production') {
    throw new StripePriceConfigError(
      `Missing STRIPE_${plan === 'monthly' ? 'MONTHLY' : 'YEARLY'}_PRICE_ID. Run \`npm run stripe:setup\` and add the price IDs to your production environment.`
    );
  }

  const productId = await findOrCreateProductId();
  return createPrice(plan, productId);
}

export async function ensureStripeCatalog(): Promise<{
  monthlyPriceId: string;
  yearlyPriceId: string;
  productId: string;
}> {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    throw new StripePriceConfigError(
      'STRIPE_SECRET_KEY is missing. Add your Stripe secret key to .env.local first.'
    );
  }

  const productId = await findOrCreateProductId();
  const monthlyPriceId = await resolveStripePriceId('monthly');
  const yearlyPriceId = await resolveStripePriceId('yearly');

  return { monthlyPriceId, yearlyPriceId, productId };
}
