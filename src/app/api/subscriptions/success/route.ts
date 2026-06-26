import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { activateSubscriptionFromCheckoutSession } from '@/lib/stripe/activate-subscription';
import { profileHasActiveSubscription } from '@/lib/stripe/profile-subscription-update';
import { getAppUrl } from '@/lib/stripe/server';

const ERROR_REDIRECTS: Record<string, string> = {
  missing_session: 'missing_session',
  session_mismatch: 'session_mismatch',
  payment_incomplete: 'payment_incomplete',
  profile_update_failed: 'profile_update_failed',
  session_invalid: 'session_invalid',
};

function dashboardSuccessUrl(appUrl: string) {
  const dashboardUrl = new URL('/dashboard', appUrl);
  dashboardUrl.searchParams.set('subscribed', '1');
  return dashboardUrl.toString();
}

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
    const loginTarget = `/api/subscriptions/success?session_id=${encodeURIComponent(sessionId)}`;
    return NextResponse.redirect(
      `${appUrl}/login?redirectTo=${encodeURIComponent(loginTarget)}`,
    );
  }

  if (await profileHasActiveSubscription(user.id)) {
    return NextResponse.redirect(dashboardSuccessUrl(appUrl));
  }

  const result = await activateSubscriptionFromCheckoutSession(sessionId, user.id);

  if (!result.ok) {
    if (await profileHasActiveSubscription(user.id)) {
      return NextResponse.redirect(dashboardSuccessUrl(appUrl));
    }

    const errorCode = ERROR_REDIRECTS[result.reason] ?? 'session_invalid';
    return NextResponse.redirect(`${appUrl}/signup?step=3&error=${errorCode}`);
  }

  return NextResponse.redirect(dashboardSuccessUrl(appUrl));
}
