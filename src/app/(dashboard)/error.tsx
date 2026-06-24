'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-brand-green/10 bg-white px-6 py-16 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-gold">
        Dashboard error
      </p>
      <h1 className="mt-4 font-display text-2xl font-bold text-brand-green sm:text-3xl">
        Couldn&apos;t load this section
      </h1>
      <p className="mt-3 max-w-md text-sm text-brand-charcoal/70">
        Something interrupted your session. Try refreshing this page or return to
        your dashboard home.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="btn-interactive rounded-lg bg-brand-green px-5 py-2.5 text-sm font-semibold text-white"
        >
          Try Again
        </button>
        <Link
          href="/dashboard"
          className="btn-interactive rounded-lg border border-brand-green/25 px-5 py-2.5 text-sm font-semibold text-brand-green"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
