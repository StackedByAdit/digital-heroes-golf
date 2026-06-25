import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { hasDashboardAccess } from '@/lib/auth/nav-access';
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

  let hasDashboard = false;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, subscription_status, subscription_ends_at')
      .eq('id', user.id)
      .maybeSingle();

    hasDashboard = hasDashboardAccess(profile);
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <Navbar
        initialAuthenticated={Boolean(user)}
        initialHasDashboardAccess={hasDashboard}
      />
      <div className="flex-1 pt-[4.5rem]">{children}</div>
      <Footer />
    </div>
  );
}
