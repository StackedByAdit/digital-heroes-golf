import { hasDashboardAccess } from '@/lib/auth/nav-access';

type ProfileAccessFields = {
  role: string | null;
  subscription_status: string | null;
  subscription_ends_at: string | null;
};

export function resolvePostLoginRedirect(
  redirectTo: string | null | undefined,
  profile: ProfileAccessFields | null | undefined,
): string {
  const isAdmin = profile?.role === 'admin';
  const canAccessDashboard = hasDashboardAccess(profile);

  const safeRedirect =
    redirectTo &&
    redirectTo.startsWith('/') &&
    !redirectTo.startsWith('//') &&
    redirectTo !== '/login'
      ? redirectTo
      : null;

  if (safeRedirect) {
    // Admins trying to go to /dashboard get sent to /admin instead
    if (isAdmin && safeRedirect.startsWith('/dashboard')) {
      return '/admin';
    }

    const needsSubscription =
      safeRedirect.startsWith('/dashboard') &&
      !safeRedirect.startsWith('/dashboard/account');

    if (needsSubscription && !canAccessDashboard) {
      return '/';
    }

    return safeRedirect;
  }

  // Default post-login landing
  if (isAdmin) return '/admin';

  return '/';
}
