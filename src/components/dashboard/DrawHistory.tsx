'use client';

import { Upload } from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/lib/utils';
import type { DrawWithMeta } from '@/lib/draw/processing';
import type { DrawEntry } from '@/types';

interface DrawHistoryProps {
  draws: DrawWithMeta[];
}

export function DrawHistory({ draws }: DrawHistoryProps) {
  const participation = useMemo(
    () => draws.filter((draw) => draw.my_entry),
    [draws]
  );

  function handleUploadProof(entry: DrawEntry) {
    // TODO: integrate proof upload API + storage
    toast.info(`Proof upload coming soon for ${entry.match_type} prize`);
  }

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
                  <td className="px-4 py-3 capitalize">{entry.payment_status}</td>
                  <td className="px-4 py-3 text-right">
                    {isWinner && entry.payment_status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleUploadProof(entry)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium hover:bg-gray-50"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload Proof
                      </button>
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
