import { hasPlatformAccess } from '@/lib/subscription/access';

type ProfileAccessFields = {
  role: string | null;
  subscription_status: string | null;
  subscription_ends_at?: string | null;
};

export function hasDashboardAccess(profile: ProfileAccessFields | null | undefined): boolean {
  if (!profile) return false;
  if (profile.role === 'admin') return true;
  return hasPlatformAccess(
    profile.subscription_status,
    profile.subscription_ends_at,
  );
}
