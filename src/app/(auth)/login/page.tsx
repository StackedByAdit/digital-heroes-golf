import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { AuthLoadingFallback } from '@/components/auth/AuthLoadingFallback';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <LoginForm />
    </Suspense>
  );
}
