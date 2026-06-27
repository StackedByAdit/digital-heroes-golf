import { redirect } from 'next/navigation';
import { NAV_PROFILE_SELECT, type NavProfileRow } from '@/lib/auth/nav-profile';
import { getAuthUser } from '@/lib/supabase/cached-auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import type { Profile } from '@/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login?redirectTo=/dashboard');
  }

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(NAV_PROFILE_SELECT)
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    redirect('/login?redirectTo=/dashboard');
  }

  const navProfile = profile as NavProfileRow;
  const shellProfile: Pick<
    Profile,
    'full_name' | 'email' | 'subscription_status' | 'subscription_ends_at' | 'role'
  > = {
    full_name: navProfile.full_name ?? user.email ?? 'Member',
    email: user.email ?? '',
    role: (navProfile.role ?? 'subscriber') as Profile['role'],
    subscription_status: (navProfile.subscription_status ??
      'inactive') as Profile['subscription_status'],
    subscription_ends_at: navProfile.subscription_ends_at ?? null,
  };

  return (
    <DashboardShell profile={shellProfile}>
      {children}
    </DashboardShell>
  );
}
