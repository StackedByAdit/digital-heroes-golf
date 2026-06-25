import { Suspense } from 'react';
import { AuthLoadingFallback } from '@/components/auth/AuthLoadingFallback';
import SignupForm from './SignupForm';

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <SignupForm />
    </Suspense>
  );
}
