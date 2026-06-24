import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata(
  'Donation received',
  'Thank you for your donation to a Digital Heroes Golf partner charity.',
);

type PageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function DonateSuccessPage({ searchParams }: PageProps) {
  const { session_id: sessionId } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold text-brand-green">
        Thank you for your donation
      </h1>
      <p className="mt-3 text-gray-600">
        Your payment was successful. We&apos;ve sent a confirmation email with your
        receipt{sessionId ? ' for this transaction' : ''}.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/charities"
          className="btn-interactive rounded-full bg-brand-green px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-green/90"
        >
          Browse charities
        </Link>
        <Link
          href="/dashboard"
          className="btn-interactive rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
