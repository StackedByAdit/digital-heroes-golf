import { Suspense } from 'react';
import { createPageMetadata } from '@/lib/seo/metadata';
import { DonateForm } from '@/components/charity/DonateForm';

export const metadata = createPageMetadata(
  'Donate',
  'Make a one-off donation to a Digital Heroes Golf partner charity. No subscription required.',
);

export default function DonatePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-gold">
          Give directly
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-brand-green sm:text-4xl">
          Donate to a charity
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-600">
          Support our partner charities with a secure one-off gift. You don&apos;t need
          a subscription to donate.
        </p>
      </div>

      <Suspense fallback={<p className="text-center text-sm text-gray-500">Loading…</p>}>
        <DonateForm />
      </Suspense>
    </div>
  );
}
