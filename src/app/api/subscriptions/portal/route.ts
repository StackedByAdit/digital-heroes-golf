import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAppUrl, stripe } from '@/lib/stripe/server';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'No billing account found' },
      { status: 404 }
    );
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${getAppUrl()}/account`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('[billing portal]', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}
