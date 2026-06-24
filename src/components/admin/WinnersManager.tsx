'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Download, Eye, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PayoutTracker } from '@/components/admin/PayoutTracker';
import {
  getWinnerDisplayStatus,
  winnerStatusLabel,
  type WinnerDisplayStatus,
  type WinnerListRow,
} from '@/lib/winners/helpers';
import { cn, formatCurrency } from '@/lib/utils';
import type { Draw } from '@/types';

type TabKey = 'all' | WinnerDisplayStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'paid', label: 'Paid' },
  { key: 'rejected', label: 'Rejected' },
];

export function WinnersManager() {
  const [winners, setWinners] = useState<WinnerListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [proofPreview, setProofPreview] = useState<WinnerListRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<WinnerListRow | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [drawFilter, setDrawFilter] = useState('');
  const [draws, setDraws] = useState<Pick<Draw, 'id' | 'month'>[]>([]);

  const loadWinners = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (drawFilter) params.set('draw_id', drawFilter);
      const query = params.toString();
      const response = await fetch(`/api/winners${query ? `?${query}` : ''}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Failed to load winners');
      setWinners(data.winners ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load winners');
    } finally {
      setLoading(false);
    }
  }, [drawFilter]);

  useEffect(() => {
    async function loadDraws() {
      try {
        const response = await fetch('/api/draws');
        const data = await response.json();
        if (response.ok) {
          setDraws(
            (data.draws ?? []).map((draw: Draw) => ({
              id: draw.id,
              month: draw.month,
            }))
          );
        }
      } catch {
        // Non-blocking — filter dropdown stays empty
      }
    }
    loadDraws();
  }, []);

  useEffect(() => {
    loadWinners();
  }, [loadWinners]);

  const filtered = useMemo(() => {
    if (tab === 'all') return winners;
    return winners.filter((winner) => getWinnerDisplayStatus(winner) === tab);
  }, [winners, tab]);

  async function verifyWinner(
    drawEntryId: string,
    action: 'approve' | 'reject',
    notes?: string,
    silent = false
  ) {
    setActionLoading(drawEntryId);
    try {
      const response = await fetch('/api/winners/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draw_entry_id: drawEntryId, action, notes }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Action failed');

      if (!silent) {
        toast.success(action === 'approve' ? 'Winner approved' : 'Winner rejected');
        setRejectTarget(null);
        setRejectNotes('');
      }
      await loadWinners();
    } catch (error) {
      if (!silent) {
        toast.error(error instanceof Error ? error.message : 'Action failed');
      }
      throw error;
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBulkApprove() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Mark ${selectedIds.length} winner(s) as paid?`)) return;

    setBulkLoading(true);
    try {
      for (const id of selectedIds) {
        await verifyWinner(id, 'approve', undefined, true);
      }
      setSelectedIds([]);
      toast.success('Bulk payout complete');
    } catch {
      toast.error('Some payouts failed to update');
    } finally {
      setBulkLoading(false);
    }
  }

  function exportCsv() {
    const headers = [
      'Winner',
      'Email',
      'Draw Month',
      'Match Type',
      'Prize',
      'Status',
      'Verified At',
    ];
    const rows = filtered.map((winner) => [
      winner.winner_name,
      winner.winner_email,
      winner.draw_month,
      winner.match_type ?? '',
      winner.prize_amount.toFixed(2),
      winnerStatusLabel(getWinnerDisplayStatus(winner)),
      winner.verified_at ?? '',
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `winners-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  }

  const statusStyles: Record<WinnerDisplayStatus, string> = {
    pending: 'bg-amber-100 text-amber-800',
    under_review: 'bg-blue-100 text-blue-800',
    paid: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <PayoutTracker
        winners={winners}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onBulkApprove={handleBulkApprove}
        bulkLoading={bulkLoading}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium',
                tab === item.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {item.label}
            </button>
          ))}
          <select
            value={drawFilter}
            onChange={(event) => setDrawFilter(event.target.value)}
            className="rounded-lg border px-3 py-1.5 text-sm"
            aria-label="Filter by draw month"
          >
            <option value="">All draws</option>
            {draws.map((draw) => (
              <option key={draw.id} value={draw.id}>
                {draw.month}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <p className="px-6 py-10 text-sm text-gray-500">Loading winners…</p>
        ) : filtered.length === 0 ? (
          <p className="px-6 py-10 text-sm text-gray-500">No winners in this tab.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Select</th>
                  <th className="px-4 py-3 text-left font-semibold">Winner</th>
                  <th className="px-4 py-3 text-left font-semibold">Draw Month</th>
                  <th className="px-4 py-3 text-left font-semibold">Match</th>
                  <th className="px-4 py-3 text-left font-semibold">Prize</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Proof</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((winner) => {
                  const displayStatus = getWinnerDisplayStatus(winner);
                  const canAct = displayStatus === 'under_review';

                  return (
                    <tr key={winner.id}>
                      <td className="px-4 py-3">
                        {canAct && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(winner.id)}
                            onChange={() => toggleSelected(winner.id)}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{winner.winner_name}</p>
                        <p className="text-xs text-gray-500">{winner.winner_email}</p>
                      </td>
                      <td className="px-4 py-3">{winner.draw_month}</td>
                      <td className="px-4 py-3">{winner.match_type}</td>
                      <td className="px-4 py-3 font-semibold">
                        {formatCurrency(winner.prize_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'rounded-full px-2 py-1 text-xs font-semibold',
                            statusStyles[displayStatus]
                          )}
                        >
                          {winnerStatusLabel(displayStatus)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {winner.proof_signed_url ? (
                          <button
                            type="button"
                            onClick={() => setProofPreview(winner)}
                            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {canAct && (
                            <>
                              <button
                                type="button"
                                disabled={actionLoading === winner.id}
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Approve payout of ${formatCurrency(winner.prize_amount)} to ${winner.winner_name}?`
                                    )
                                  ) {
                                    verifyWinner(winner.id, 'approve');
                                  }
                                }}
                                className="rounded-md border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={actionLoading === winner.id}
                                onClick={() => setRejectTarget(winner)}
                                className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog.Root
        open={proofPreview !== null}
        onOpenChange={(open) => !open && setProofPreview(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold">
                Proof — {proofPreview?.winner_name}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="rounded-md p-1 hover:bg-gray-100">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            {proofPreview?.proof_signed_url && (
              <div className="mt-4">
                {proofPreview.proof_url?.endsWith('.pdf') ? (
                  <iframe
                    title="Winner proof"
                    src={proofPreview.proof_signed_url}
                    className="h-[70vh] w-full rounded-lg border"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={proofPreview.proof_signed_url}
                    alt="Winner proof"
                    className="mx-auto max-h-[70vh] rounded-lg object-contain"
                  />
                )}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectNotes('');
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold">Reject proof</Dialog.Title>
            <p className="mt-2 text-sm text-gray-600">
              Reject proof for {rejectTarget?.winner_name}? They can upload again.
            </p>
            <label className="mt-4 block text-sm">
              <span className="font-medium text-gray-700">Notes (optional)</span>
              <textarea
                value={rejectNotes}
                onChange={(event) => setRejectNotes(event.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                rows={3}
                placeholder="Reason for rejection…"
              />
            </label>
            <div className="mt-5 flex justify-end gap-3">
              <Dialog.Close asChild>
                <button type="button" className="rounded-lg border px-4 py-2 text-sm">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="button"
                disabled={!rejectTarget || actionLoading === rejectTarget.id}
                onClick={() =>
                  rejectTarget &&
                  verifyWinner(rejectTarget.id, 'reject', rejectNotes || undefined)
                }
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Reject proof
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
