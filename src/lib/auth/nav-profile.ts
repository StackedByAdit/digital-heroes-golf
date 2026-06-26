import { hasDashboardAccess } from '@/lib/auth/nav-access';

/** Columns safe for nav/auth UI — keep minimal for fast middleware queries. */
export const NAV_PROFILE_SELECT =
  'full_name, role, subscription_status' as const;

export type NavProfileRow = {
  full_name?: string | null;
  role: string | null;
  subscription_status: string | null;
  subscription_ends_at?: string | null;
};

export function dashboardAccessFromNavProfile(
  profile: NavProfileRow | null | undefined,
): boolean {
  return hasDashboardAccess({
    role: profile?.role ?? null,
    subscription_status: profile?.subscription_status ?? null,
    subscription_ends_at: profile?.subscription_ends_at ?? null,
  });
}

export function isAdminProfile(profile: NavProfileRow | null | undefined): boolean {
  return profile?.role === 'admin';
}

export function toProfileAccessFields(
  profile: NavProfileRow | null | undefined,
): {
  role: string | null;
  subscription_status: string | null;
  subscription_ends_at: string | null;
} {
  return {
    role: profile?.role ?? null,
    subscription_status: profile?.subscription_status ?? null,
    subscription_ends_at: profile?.subscription_ends_at ?? null,
  };
}
