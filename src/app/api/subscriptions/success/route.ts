import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAppUrl, stripe } from '@/lib/stripe/server';
import { planFromMetadata } from '@/lib/stripe/subscription-sync';
import type { SubscriptionPlan } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const appUrl = getAppUrl();

  if (!sessionId) {
    return NextResponse.redirect(`${appUrl}/pricing?error=missing_session`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${appUrl}/login?redirectTo=/pricing`);
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (session.metadata?.userId !== user.id) {
      return NextResponse.redirect(`${appUrl}/pricing?error=session_mismatch`);
    }

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return NextResponse.redirect(`${appUrl}/pricing?error=payment_incomplete`);
    }

    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    const plan =
      planFromMetadata(session.metadata?.plan) ??
      (session.metadata?.plan as SubscriptionPlan | undefined) ??
      null;

    const charityId = session.metadata?.charityId ?? null;
    const charityPercentage = session.metadata?.charityPercentage
      ? Number(session.metadata.charityPercentage)
      : undefined;

    const admin = createAdminClient();
    const { error } = await admin
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_plan: plan,
        stripe_subscription_id: subscriptionId ?? null,
        stripe_customer_id:
          typeof session.customer === 'string' ? session.customer : session.customer?.id,
        charity_id: charityId,
        ...(charityPercentage !== undefined && {
          charity_percentage: charityPercentage,
        }),
      })
      .eq('id', user.id);

    if (error) {
      console.error('[subscription success]', error);
      return NextResponse.redirect(`${appUrl}/pricing?error=profile_update_failed`);
    }

    return NextResponse.redirect(`${appUrl}/dashboard`);
  } catch (error) {
    console.error('[subscription success]', error);
    return NextResponse.redirect(`${appUrl}/pricing?error=session_invalid`);
  }
}
