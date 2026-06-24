'use client';

import { useMemo } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import {
  getWinnerDisplayStatus,
  type WinnerListRow,
} from '@/lib/winners/helpers';

interface PayoutTrackerProps {
  winners: WinnerListRow[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onBulkApprove: () => void;
  bulkLoading?: boolean;
}

export function PayoutTracker({
  winners,
  selectedIds,
  onSelectionChange,
  onBulkApprove,
  bulkLoading = false,
}: PayoutTrackerProps) {
  const stats = useMemo(() => {
    const paid = winners.filter((w) => w.payment_status === 'paid');
    const pending = winners.filter(
      (w) =>
        w.payment_status === 'pending' &&
        getWinnerDisplayStatus(w) !== 'under_review'
    );
    const underReview = winners.filter(
      (w) => getWinnerDisplayStatus(w) === 'under_review'
    );
    const overdue = winners.filter((w) => {
      if (w.payment_status !== 'pending') return false;
      return differenceInDays(new Date(), parseISO(w.created_at)) > 30;
    });

    return {
      totalPaid: paid.reduce((sum, w) => sum + w.prize_amount, 0),
      pendingCount: pending.length + underReview.length,
      pendingTotal: [...pending, ...underReview].reduce(
        (sum, w) => sum + w.prize_amount,
        0
      ),
      overdueCount: overdue.length,
      overdueTotal: overdue.reduce((sum, w) => sum + w.prize_amount, 0),
      approvableIds: underReview.map((w) => w.id),
    };
  }, [winners]);

  const allSelected =
    stats.approvableIds.length > 0 &&
    stats.approvableIds.every((id) => selectedIds.includes(id));

  function toggleAll() {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(stats.approvableIds);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total distributed"
        value={formatCurrency(stats.totalPaid)}
        tone="emerald"
      />
      <StatCard
        label="Pending payouts"
        value={`${stats.pendingCount} (${formatCurrency(stats.pendingTotal)})`}
        tone="amber"
      />
      <StatCard
        label="Overdue (30+ days)"
        value={`${stats.overdueCount} (${formatCurrency(stats.overdueTotal)})`}
        tone={stats.overdueCount > 0 ? 'red' : 'gray'}
      />
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-600">Bulk actions</p>
        <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            disabled={stats.approvableIds.length === 0}
          />
          Select all pending ({stats.approvableIds.length})
        </label>
        <button
          type="button"
          onClick={onBulkApprove}
          disabled={selectedIds.length === 0 || bulkLoading}
          className="mt-3 w-full rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {bulkLoading
            ? 'Marking paid…'
            : `Mark ${selectedIds.length || ''} as paid`.trim()}
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'emerald' | 'amber' | 'red' | 'gray';
}) {
  const toneClasses = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    red: 'border-red-200 bg-red-50 text-red-900',
    gray: 'border-gray-200 bg-white text-gray-900',
  };

  return (
    <div className={cn('rounded-xl border p-4 shadow-sm', toneClasses[tone])}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}
