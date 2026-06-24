'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import {
  getWinnerDisplayStatus,
  winnerStatusLabel,
} from '@/lib/winners/helpers';
import type { DrawWithMeta } from '@/lib/draw/processing';

interface DrawHistoryProps {
  draws: DrawWithMeta[];
}

export function DrawHistory({ draws }: DrawHistoryProps) {
  const participation = useMemo(
    () => draws.filter((draw) => draw.my_entry),
    [draws]
  );

  if (participation.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
        You have not participated in any published draws yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Month</th>
              <th className="px-4 py-3 text-left font-semibold">Your Scores</th>
              <th className="px-4 py-3 text-left font-semibold">Drawn Numbers</th>
              <th className="px-4 py-3 text-left font-semibold">Match</th>
              <th className="px-4 py-3 text-left font-semibold">Prize</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {participation.map((draw) => {
              const entry = draw.my_entry!;
              const isWinner = Boolean(entry.match_type && entry.prize_amount > 0);
              const displayStatus = getWinnerDisplayStatus(entry);

              return (
                <tr
                  key={draw.id}
                  className={cn(isWinner && 'bg-emerald-50/60')}
                >
                  <td className="px-4 py-3 font-medium">{draw.month}</td>
                  <td className="px-4 py-3">
                    {entry.user_scores.length > 0
                      ? entry.user_scores.join(', ')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">{draw.drawn_numbers.join(', ')}</td>
                  <td className="px-4 py-3">{entry.match_type ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold">
                    {entry.prize_amount > 0
                      ? formatCurrency(Number(entry.prize_amount))
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {isWinner ? winnerStatusLabel(displayStatus) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isWinner && (
                      <Link
                        href="/dashboard"
                        className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
                      >
                        {displayStatus === 'pending' || displayStatus === 'rejected'
                          ? 'Upload proof'
                          : 'View on dashboard'}
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
