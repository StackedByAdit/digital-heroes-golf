import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';

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
    .select('stripe_subscription_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.stripe_subscription_id) {
    return NextResponse.json(
      { error: 'No active subscription found' },
      { status: 404 }
    );
  }

  try {
    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from('profiles')
      .update({ subscription_status: 'cancelled' })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      message:
        'Subscription cancelled. Access remains until the end of your billing period, but dashboard access is now restricted per account policy.',
    });
  } catch (error) {
    console.error('[subscription cancel]', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
