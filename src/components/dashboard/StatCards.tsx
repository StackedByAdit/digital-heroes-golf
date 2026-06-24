import Link from 'next/link';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import type { CharityWithContribution, DashboardProfile, NextDrawInfo, WinningsSummary } from '@/lib/dashboard/data';

interface StatCardsProps {
  profile: DashboardProfile;
  nextDraw: NextDrawInfo;
  winnings: WinningsSummary;
  charity: CharityWithContribution;
}

export function StatCards({
  profile,
  nextDraw,
  winnings,
  charity,
}: StatCardsProps) {
  const planLabel =
    profile.subscription_plan === 'yearly'
      ? 'Yearly'
      : profile.subscription_plan === 'monthly'
        ? 'Monthly'
        : 'No plan';

  const statusStyles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800',
    inactive: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-amber-100 text-amber-800',
    past_due: 'bg-red-100 text-red-800',
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Subscription">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-lg font-semibold text-gray-900">{planLabel}</p>
            <span
              className={cn(
                'mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize',
                statusStyles[profile.subscription_status] ??
                  'bg-gray-100 text-gray-700',
              )}
            >
              {profile.subscription_status.replace('_', ' ')}
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Renewal:{' '}
          {profile.renewalDate
            ? format(new Date(profile.renewalDate), 'd MMM yyyy')
            : '—'}
        </p>
        <Link
          href="/dashboard/account"
          className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-900"
        >
          Manage →
        </Link>
      </StatCard>

      <StatCard title="Next Draw">
        <p className="text-lg font-semibold text-gray-900">{nextDraw.label}</p>
        <p className="mt-2 text-sm text-gray-600">
          Est. prize pool: {formatCurrency(nextDraw.estimatedPool)}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {nextDraw.subscriberCount} active subscribers
        </p>
      </StatCard>

      <StatCard title="Total Winnings">
        <p className="text-2xl font-bold text-gray-900">
          {formatCurrency(winnings.totalWon)}
        </p>
        <p className="mt-2 text-sm text-gray-600">
          {formatCurrency(winnings.totalPaid)} paid out
        </p>
        <Link
          href="/dashboard/draws"
          className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-900"
        >
          View history →
        </Link>
      </StatCard>

      <StatCard title="Charity Impact">
        <p className="text-2xl font-bold text-gray-900">
          {formatCurrency(charity.lifetimeContribution)}
        </p>
        <p className="mt-2 text-sm text-gray-600">
          {charity.charity
            ? `Contributed to ${charity.charity.name} (${charity.percentage}%)`
            : 'No charity selected yet'}
        </p>
        <Link
          href="/dashboard/charity"
          className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-900"
        >
          Manage charity →
        </Link>
      </StatCard>
    </div>
  );
}

function StatCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-card rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}
