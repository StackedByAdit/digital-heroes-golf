import { NextResponse } from 'next/server';
import { format } from 'date-fns';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/draw/processing';
import { notifySubscriptionCancelledEmail } from '@/lib/email/notifications';
import { stripe } from '@/lib/stripe/server';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from('profiles')
      .select('full_name, email, stripe_subscription_id, subscription_status')
      .eq('id', id)
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!profile.stripe_subscription_id) {
      const { error: updateError } = await admin
        .from('profiles')
        .update({ subscription_status: 'cancelled' })
        .eq('id', id);

      if (updateError) throw new Error(updateError.message);

      return NextResponse.json({
        message: 'Subscription marked as cancelled (no Stripe subscription on file).',
      });
    }

    const subscription = await stripe.subscriptions.retrieve(
      profile.stripe_subscription_id
    );

    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    const { error: updateError } = await admin
      .from('profiles')
      .update({ subscription_status: 'cancelled' })
      .eq('id', id);

    if (updateError) throw new Error(updateError.message);

    const periodEndUnix = (subscription as { current_period_end?: number })
      .current_period_end;
    const periodEnd = periodEndUnix
      ? format(new Date(periodEndUnix * 1000), 'd MMMM yyyy')
      : 'the end of the billing period';

    if (profile.email) {
      notifySubscriptionCancelledEmail({
        email: profile.email,
        name: profile.full_name,
        endDate: periodEnd,
      });
    }

    return NextResponse.json({
      message: `Subscription cancelled. Access ends ${periodEnd}.`,
    });
  } catch (error) {
    console.error('[admin cancel subscription]', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
