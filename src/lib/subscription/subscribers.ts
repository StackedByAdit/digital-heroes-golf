import { createAdminClient } from '@/lib/supabase/server';
import type { Profile } from '@/types';
import { hasPlatformAccess } from '@/lib/subscription/access';

export async function fetchPlatformAccessProfiles(): Promise<Profile[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('*')
    .in('subscription_status', ['active', 'past_due', 'cancelled']);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Profile[]).filter((profile) =>
    hasPlatformAccess(profile.subscription_status, profile.subscription_ends_at)
  );
}

export async function countPlatformAccessSubscribers(): Promise<number> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return 0;
  }

  try {
    const profiles = await fetchPlatformAccessProfiles();
    return profiles.length;
  } catch {
    return 0;
  }
}
