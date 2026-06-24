import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { getAdminStats } from '@/lib/admin/stats';
import { formatCurrency } from '@/lib/utils';

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
        <p className="mt-1 text-sm text-gray-600">
          Real-time platform summary across subscribers, draws, charities, and winners.
        </p>
      </div>

      {stats.pending_winners > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">
              {stats.pending_winners} winner verification
              {stats.pending_winners === 1 ? '' : 's'} pending
            </p>
            <Link href="/admin/winners" className="font-medium underline">
              Review in Winners →
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <OverviewCard label="Total users" value={String(stats.total_users)} />
        <OverviewCard
          label="Active subscribers"
          value={String(stats.active_subscribers)}
        />
        <OverviewCard
          label="Prize pool this month"
          value={formatCurrency(stats.total_prize_pool_this_month)}
        />
        <OverviewCard
          label="Charity contributions"
          value={formatCurrency(stats.total_charity_contributions)}
        />
        <OverviewCard
          label="Draws this year"
          value={String(stats.draws_this_year)}
        />
        <OverviewCard
          label="Pending verifications"
          value={String(stats.pending_winners)}
          alert={stats.pending_winners > 0}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Revenue snapshot</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">MRR</dt>
              <dd className="font-semibold">{formatCurrency(stats.mrr)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Monthly subscribers</dt>
              <dd>{stats.monthly_subscribers}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Yearly subscribers</dt>
              <dd>{stats.yearly_subscribers}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Top charities</h2>
          {stats.charities_breakdown.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">No charity data yet.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {stats.charities_breakdown.slice(0, 5).map((charity) => (
                <li
                  key={charity.charity_name}
                  className="flex justify-between rounded-lg bg-gray-50 px-3 py-2"
                >
                  <span>{charity.charity_name}</span>
                  <span className="font-medium">{charity.subscriber_count} users</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function OverviewCard({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${
        alert ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white'
      }`}
    >
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
