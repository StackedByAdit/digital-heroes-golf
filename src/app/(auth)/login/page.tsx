import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { NAV_PROFILE_SELECT, toProfileAccessFields, type NavProfileRow } from '@/lib/auth/nav-profile';
import { resolvePostLoginRedirect } from '@/lib/auth/post-login';
import { createClient } from '@/lib/supabase/server';
import { AuthLoadingFallback } from '@/components/auth/AuthLoadingFallback';
import LoginForm from './LoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select(NAV_PROFILE_SELECT)
      .eq('id', user.id)
      .maybeSingle();

    redirect(
      resolvePostLoginRedirect(
        searchParams.redirectTo,
        toProfileAccessFields(profile as NavProfileRow | null),
      ),
    );
  }

  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <LoginForm />
    </Suspense>
  );
}
