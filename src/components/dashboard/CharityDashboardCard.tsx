import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import type { CharityWithContribution } from '@/lib/dashboard/data';
import type { Profile } from '@/types';

interface CharityDashboardCardProps {
  profile: Profile;
  charityData: CharityWithContribution;
}

export function CharityDashboardCard({
  profile,
  charityData,
}: CharityDashboardCardProps) {
  const { charity, monthlyContribution, percentage } = charityData;

  return (
    <section className="h-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Your charity</h2>
        <Link
          href="/dashboard/charity"
          className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
        >
          Change
        </Link>
      </div>

      {charity ? (
        <div className="mt-4">
          <div className="flex gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {charity.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={charity.image_url}
                  alt={charity.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{charity.name}</p>
              <p className="mt-1 text-sm text-gray-600">{percentage}% of subscription</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-emerald-800">
            You&apos;re contributing{' '}
            <span className="font-semibold">
              {formatCurrency(monthlyContribution)} per month
            </span>{' '}
            to {charity.name}.
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-600">
          No charity selected.{' '}
          <Link href="/dashboard/charity" className="font-semibold text-emerald-700">
            Choose one now
          </Link>
        </p>
      )}

      {!profile.charity_id && profile.subscription_status === 'active' && (
        <p className="mt-3 text-xs text-amber-700">
          Select a charity to start giving with your subscription.
        </p>
      )}
    </section>
  );
}
