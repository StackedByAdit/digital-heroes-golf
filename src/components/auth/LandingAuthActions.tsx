'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { useNavAuth } from '@/hooks/useNavAuth';

type LandingAuthActionsProps = {
  initialAuthenticated?: boolean;
  initialHasDashboardAccess?: boolean;
  initialUserName?: string | null;
  initialIsAdmin?: boolean;
  variant?: 'hero' | 'footer';
};

export function LandingAuthActions({
  initialAuthenticated = false,
  initialHasDashboardAccess = false,
  initialUserName = null,
  initialIsAdmin = false,
  variant = 'hero',
}: LandingAuthActionsProps) {
  const { isAuthenticated, hasDashboardAccess, isAdmin } = useNavAuth(
    initialAuthenticated,
    initialHasDashboardAccess || initialIsAdmin,
    initialUserName,
    initialIsAdmin,
  );

  const showAdmin = isAdmin || initialIsAdmin;
  const canUseDashboard = hasDashboardAccess || showAdmin;

  if (variant === 'footer') {
    if (isAuthenticated && canUseDashboard) {
      return (
        <Link
          href="/charities"
          className="btn-interactive btn-hero-primary mt-8 px-8 py-3.5"
        >
          Browse charities
          <span className="btn-hero-icon">
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      );
    }

    if (isAuthenticated) {
      return (
        <div className="mt-8 flex flex-col items-center gap-4">
          <Link
            href="/pricing#plans"
            className="btn-interactive btn-hero-primary px-8 py-3.5"
          >
            Choose your plan
            <span className="btn-hero-icon">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
          <div className="text-sm text-white/80">
            Wrong account?{' '}
            <SignOutButton
              showIcon={false}
              label="Log out"
              className="font-semibold text-white hover:underline"
            />
          </div>
        </div>
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

  if (isAuthenticated && canUseDashboard) {
    return (
      <div className="mt-10">
        <Link
          href="/charities"
          className="btn-interactive rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
        >
          Browse charities
        </Link>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/pricing#plans" className="btn-interactive btn-hero-primary">
            Choose your plan
            <span className="btn-hero-icon">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
          <Link
            href="/signup?step=2"
            className="btn-interactive rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Resume signup
          </Link>
        </div>
        <div className="text-sm text-white/75">
          Wrong account?{' '}
          <SignOutButton
            showIcon={false}
            label="Log out"
            className="font-semibold text-white hover:underline"
          />
        </div>
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
