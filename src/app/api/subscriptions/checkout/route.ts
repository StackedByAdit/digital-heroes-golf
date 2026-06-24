import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAppUrl, getOrCreateStripeCustomer, stripe } from '@/lib/stripe/server';
import {
  StripePriceConfigError,
  resolveStripePriceId,
} from '@/lib/stripe/prices';
import { CheckoutSchema } from '@/lib/validations';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { plan, charityId, charityPercentage } = parsed.data;

  const { data: charity, error: charityError } = await supabase
    .from('charities')
    .select('id')
    .eq('id', charityId)
    .eq('is_active', true)
    .maybeSingle();

  if (charityError || !charity) {
    return NextResponse.json(
      { error: 'Selected charity is not available' },
      { status: 400 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  let priceId: string;
  try {
    priceId = await resolveStripePriceId(plan);
  } catch (error) {
    if (error instanceof StripePriceConfigError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw error;
  }

  try {
    const customerId = await getOrCreateStripeCustomer(
      user.id,
      profile.email,
      profile.full_name
    );

    const appUrl = getAppUrl();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/api/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      metadata: {
        userId: user.id,
        charityId,
        charityPercentage: String(charityPercentage),
        plan,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          charityId,
          charityPercentage: String(charityPercentage),
          plan,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[checkout]', error);
    return NextResponse.json(
      { error: 'Unable to create checkout session' },
      { status: 500 }
    );
  }
}
