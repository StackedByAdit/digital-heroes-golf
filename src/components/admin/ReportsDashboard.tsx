'use client';

import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import type { AdminStats } from '@/lib/admin/stats';

const PIE_COLORS = [
  '#dc2626',
  '#2563eb',
  '#16a34a',
  '#ca8a04',
  '#9333ea',
  '#0891b2',
  '#ea580c',
  '#64748b',
];

export function ReportsDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? 'Failed to load stats');
        setStats(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function downloadCsv() {
    if (!stats) return;

    const rows: string[][] = [
      ['Metric', 'Value'],
      ['Active subscribers', String(stats.active_subscribers)],
      ['Monthly subscribers', String(stats.monthly_subscribers)],
      ['Yearly subscribers', String(stats.yearly_subscribers)],
      ['MRR', String(stats.mrr)],
      ['Churn rate (%)', String(stats.churn_rate)],
      ['Prize pool this month', String(stats.total_prize_pool_this_month)],
      ['Total charity contributions', String(stats.total_charity_contributions)],
      ['Pending winners', String(stats.pending_winners)],
      ['Draws this year', String(stats.draws_this_year)],
      ['Average prize per winner', String(stats.average_prize)],
      ['Current rollover', String(stats.current_rollover)],
      [],
      ['Win rate tier', 'Winners', 'Entries', 'Rate (%)'],
      ...stats.win_rates.map((row) => [
        row.tier,
        String(row.winners),
        String(row.entries),
        String(row.rate),
      ]),
      [],
      ['Charity', 'Subscribers', 'Contributions'],
      ...stats.charities_breakdown.map((row) => [
        row.charity_name,
        String(row.subscriber_count),
        String(row.total_contributions),
      ]),
      [],
      ['Rollover month', 'Amount'],
      ...stats.rollover_history.map((row) => [row.month, String(row.amount)]),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `digital-heroes-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading reports…</p>;
  }

  if (!stats) {
    return <p className="text-sm text-red-600">Unable to load report data.</p>;
  }

  const mostPopular = stats.charities_breakdown[0];
  const pieTotal = stats.charities_breakdown.reduce(
    (sum, charity) => sum + charity.total_contributions,
    0
  );

  let pieGradient = 'conic-gradient(#e5e7eb 0deg 360deg)';
  if (pieTotal > 0) {
    let cursor = 0;
    const segments = stats.charities_breakdown.map((charity, index) => {
      const share = (charity.total_contributions / pieTotal) * 360;
      const start = cursor;
      cursor += share;
      return `${PIE_COLORS[index % PIE_COLORS.length]} ${start}deg ${cursor}deg`;
    });
    pieGradient = `conic-gradient(${segments.join(', ')})`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Aggregated metrics from subscribers, draws, charities, and winners.
        </p>
        <button
          type="button"
          onClick={downloadCsv}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Download Full Report (CSV)
        </button>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Revenue</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="MRR" value={formatCurrency(stats.mrr)} />
          <Metric
            label="Monthly subscribers"
            value={String(stats.monthly_subscribers)}
          />
          <Metric
            label="Yearly subscribers"
            value={String(stats.yearly_subscribers)}
          />
          <Metric label="Churn rate" value={`${stats.churn_rate}%`} />
        </dl>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Draws</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Metric
            label="Average prize per winner"
            value={formatCurrency(stats.average_prize)}
          />
          <Metric
            label="Current rollover"
            value={formatCurrency(stats.current_rollover)}
          />
          <Metric
            label="Prize pool this month"
            value={formatCurrency(stats.total_prize_pool_this_month)}
          />
        </dl>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700">Win rate per tier</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">Tier</th>
                  <th className="py-2 pr-4">Winners</th>
                  <th className="py-2 pr-4">Entries</th>
                  <th className="py-2">Rate</th>
                </tr>
              </thead>
              <tbody>
                {stats.win_rates.map((row) => (
                  <tr key={row.tier} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium">{row.tier}</td>
                    <td className="py-2 pr-4">{row.winners}</td>
                    <td className="py-2 pr-4">{row.entries}</td>
                    <td className="py-2">{row.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700">Jackpot rollover history</h3>
          {stats.rollover_history.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No published draws yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {stats.rollover_history.map((row) => (
                <li
                  key={row.month}
                  className="flex justify-between rounded-lg bg-gray-50 px-3 py-2"
                >
                  <span>{row.month}</span>
                  <span className="font-medium">{formatCurrency(row.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Charity</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Metric
            label="Total contributed"
            value={formatCurrency(stats.total_charity_contributions)}
          />
          <Metric
            label="Most popular charity"
            value={mostPopular?.charity_name ?? '—'}
            sub={
              mostPopular
                ? `${mostPopular.subscriber_count} subscribers`
                : undefined
            }
          />
        </dl>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Contributions by charity</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {stats.charities_breakdown.map((charity) => (
                <li
                  key={charity.charity_name}
                  className="flex justify-between rounded-lg bg-gray-50 px-3 py-2"
                >
                  <span>{charity.charity_name}</span>
                  <span className="font-medium">
                    {formatCurrency(charity.total_contributions)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700">Charity breakdown</h3>
            <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div
                className="h-40 w-40 shrink-0 rounded-full border border-gray-200"
                style={{ background: pieGradient }}
                aria-hidden
              />
              <ul className="space-y-2 text-sm">
                {stats.charities_breakdown.map((charity, index) => {
                  const pct =
                    pieTotal > 0
                      ? Math.round((charity.total_contributions / pieTotal) * 1000) / 10
                      : 0;
                  return (
                    <li key={charity.charity_name} className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                        }}
                      />
                      <span>
                        {charity.charity_name} ({pct}%)
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <dt className="text-sm text-gray-600">{label}</dt>
      <dd className="mt-1 text-xl font-bold text-gray-900">{value}</dd>
      {sub && <dd className="mt-1 text-xs text-gray-500">{sub}</dd>}
    </div>
  );
}
