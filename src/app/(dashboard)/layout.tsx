import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { SubscriptionWelcomeToast } from '@/components/dashboard/SubscriptionWelcomeToast';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/dashboard');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, subscription_status')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  return (
    <DashboardShell profile={profile}>
      <Suspense fallback={null}>
        <SubscriptionWelcomeToast />
      </Suspense>
      {children}
    </DashboardShell>
  );
}
