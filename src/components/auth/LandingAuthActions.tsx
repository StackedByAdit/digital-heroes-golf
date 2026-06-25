'use client';

import Link from 'next/link';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { useAuthSession } from '@/hooks/useAuthSession';

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
          className="btn-interactive btn-hero-primary mt-8 px-8 py-3.5"
        >
          Go to your dashboard
          <span className="btn-hero-icon">
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      );
    }

    return (
      <div className="mt-8 flex flex-col items-center gap-4">
        <Link href="/signup" className="btn-interactive btn-hero-primary px-8 py-3.5">
          Get started
          <span className="btn-hero-icon">
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
        <p className="text-sm text-white/80">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-white hover:underline">
            Log in
          </Link>
        </p>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link href="/dashboard" className="btn-interactive btn-hero-primary">
          <LayoutDashboard className="h-4 w-4" />
          Open your dashboard
          <span className="btn-hero-icon">
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
        <Link
          href="/charities"
          className="btn-interactive rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Browse charities
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
      <Link href="/how-it-works" className="btn-interactive btn-hero-primary">
        How the platform works
        <span className="btn-hero-icon">
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
      <Link
        href="/signup"
        className="btn-interactive rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
      >
        Get started free
      </Link>
    </div>
  );
}
