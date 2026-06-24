'use client';

import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { cn } from '@/lib/utils';

type LandingAuthActionsProps = {
  initialAuthenticated?: boolean;
  variant?: 'hero' | 'footer';
};

export function LandingAuthActions({
  initialAuthenticated = false,
  variant = 'hero',
}: LandingAuthActionsProps) {
  const { isAuthenticated } = useAuthSession(initialAuthenticated);

  if (variant === 'footer') {
    if (isAuthenticated) {
      return (
        <Link
          href="/dashboard"
          className="btn-interactive btn-cta mt-8 inline-flex items-center gap-2 rounded-full bg-brand-gold px-10 py-4 text-sm font-semibold text-brand-charcoal transition hover:bg-brand-gold/90"
        >
          <LayoutDashboard className="h-4 w-4" />
          Go to your dashboard
        </Link>
      );
    }

    return (
      <div className="mt-8 flex flex-col items-center gap-4">
        <Link
          href="/signup"
          className="btn-interactive btn-cta inline-flex rounded-full bg-brand-gold px-10 py-4 text-sm font-semibold text-brand-charcoal transition hover:bg-brand-gold/90"
        >
          Sign up today
        </Link>
        <p className="text-sm text-brand-cream/70">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-brand-gold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
        <Link
          href="/dashboard"
          className="btn-interactive btn-cta inline-flex items-center justify-center gap-2 rounded-full bg-brand-gold px-8 py-3.5 text-sm font-semibold text-brand-charcoal transition hover:bg-brand-gold/90"
        >
          <LayoutDashboard className="h-4 w-4" />
          Go to Dashboard
        </Link>
        <Link
          href="/charities"
          className="btn-interactive rounded-full border border-white/30 px-8 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/10"
        >
          See the Charities
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
      <Link
        href="/signup"
        className="btn-interactive btn-cta rounded-full bg-brand-gold px-8 py-3.5 text-center text-sm font-semibold text-brand-charcoal transition hover:bg-brand-gold/90"
      >
        Sign up
      </Link>
      <Link
        href="/login"
        className={cn(
          'btn-interactive rounded-full border px-8 py-3.5 text-center text-sm font-semibold transition',
          'border-white/30 text-white hover:bg-white/10'
        )}
      >
        Log in
      </Link>
      <Link
        href="/charities"
        className="btn-interactive rounded-full border border-white/20 px-8 py-3.5 text-center text-sm font-semibold text-brand-cream/90 transition hover:bg-white/5"
      >
        See the Charities
      </Link>
    </div>
  );
}
