'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-cream px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-gold">
        Something went wrong
      </p>
      <h1 className="mt-4 font-display text-3xl font-bold text-brand-green sm:text-4xl">
        We hit an unexpected bunker
      </h1>
      <p className="mt-4 max-w-md text-brand-charcoal/70">
        An error occurred while loading this page. Please try again, or head back to
        your dashboard.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="btn-interactive btn-cta rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-charcoal"
        >
          Try Again
        </button>
        <Link
          href="/dashboard"
          className="btn-interactive rounded-full border border-brand-green/25 px-6 py-3 text-sm font-semibold text-brand-green"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
