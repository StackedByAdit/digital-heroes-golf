import { Suspense } from 'react';
import SignupForm from './SignupForm';

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="text-sm text-brand-charcoal/60">Loading…</div>}>
      <SignupForm />
    </Suspense>
  );
}
