import { NextResponse } from 'next/server';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notifySubscriptionCancelledEmail } from '@/lib/email/notifications';
import { subscriptionPeriodEndIso } from '@/lib/stripe/subscription-sync';
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
    .select('full_name, email, stripe_subscription_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.stripe_subscription_id) {
    return NextResponse.json(
      { error: 'No active subscription found' },
      { status: 404 }
    );
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(
      profile.stripe_subscription_id
    );

    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    const periodEndIso = subscriptionPeriodEndIso(subscription);
    const periodEnd = periodEndIso
      ? format(new Date(periodEndIso), 'd MMMM yyyy')
      : 'the end of your billing period';

    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from('profiles')
      .update({
        subscription_status: 'cancelled',
        subscription_ends_at: periodEndIso,
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (profile.email) {
      notifySubscriptionCancelledEmail({
        email: profile.email,
        name: profile.full_name,
        endDate: periodEnd,
      });
    }

    return NextResponse.json({
      message: `Subscription cancelled. You keep full access until ${periodEnd}.`,
    });
  } catch (error) {
    console.error('[subscription cancel]', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
