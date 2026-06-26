import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import {
  dashboardAccessFromNavProfile,
  isAdminProfile,
  NAV_PROFILE_SELECT,
  type NavProfileRow,
} from '@/lib/auth/nav-profile';
import { createClient } from '@/lib/supabase/server';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: NavProfileRow | null = null;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select(NAV_PROFILE_SELECT)
      .eq('id', user.id)
      .maybeSingle();

    profile = data as NavProfileRow | null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <Navbar
        initialAuthenticated={Boolean(user)}
        initialHasDashboardAccess={dashboardAccessFromNavProfile(profile)}
        initialIsAdmin={isAdminProfile(profile)}
        initialUserName={profile?.full_name ?? null}
      />
      <div className="flex-1 pt-[4.5rem]">{children}</div>
      <Footer
        hideSubscriptionLinks={dashboardAccessFromNavProfile(profile)}
      />
    </div>
  );
}
