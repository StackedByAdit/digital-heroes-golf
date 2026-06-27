type ProfileAccessFields = {
  role: string | null;
  subscription_status: string | null;
  subscription_ends_at: string | null;
};

/**
 * After sign-in, send users to the public landing page so they can open
 * Dashboard / Admin Panel from the navbar. Only interrupted API flows
 * (e.g. Stripe checkout completion) keep their original redirect target.
 */
export function resolvePostLoginRedirect(
  redirectTo: string | null | undefined,
  profile?: ProfileAccessFields | null,
): string {
  void profile;
  const safeRedirect =
    redirectTo &&
    redirectTo.startsWith('/') &&
    !redirectTo.startsWith('//') &&
    redirectTo !== '/login'
      ? redirectTo
      : null;

  if (safeRedirect?.startsWith('/api/')) {
    return safeRedirect;
  }

  return '/';
}
