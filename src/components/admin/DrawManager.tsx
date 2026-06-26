'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Eye, Play, Plus, RefreshCw, Rocket, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn, formatCurrency, getMonthKey } from '@/lib/utils';
import { drawTypeLabel, nextDrawType } from '@/lib/drawEngine';
import type { Draw, DrawStatus, DrawType } from '@/types';
import type { DrawWithMeta } from '@/lib/draw/processing';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

type SimulationResponse = {
  draw_id: string;
  drawn_numbers: number[];
  summary: {
    total_subscribers: number;
    '5_match_winners': number;
    '4_match_winners': number;
    '3_match_winners': number;
    jackpot_rolls_over: boolean;
  };
  prize_breakdown: {
    jackpot: number;
    pool_4match: number;
    each_4match_winner: number;
    pool_3match: number;
    each_3match_winner: number;
    each_5match_winner: number;
  };
};

const STATUS_STYLES: Record<DrawStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  simulated: 'bg-blue-100 text-blue-800',
  published: 'bg-emerald-100 text-emerald-800',
};

type DrawManagerProps = {
  draws: DrawWithMeta[];
  loading: boolean;
  onRefresh: () => Promise<void>;
};

export function DrawManager({ draws, loading, onRefresh }: DrawManagerProps) {
  const [creating, setCreating] = useState(false);
  const [month, setMonth] = useState(getMonthKey());
  const [drawType, setDrawType] = useState<DrawType>('random');
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [publishTarget, setPublishTarget] = useState<DrawWithMeta | null>(null);
  const [publishPreview, setPublishPreview] = useState<SimulationResponse | null>(null);
  const [viewDraw, setViewDraw] = useState<DrawWithMeta | null>(null);
  const [busyDrawId, setBusyDrawId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Draw | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleCreateDraw(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    try {
      const response = await fetch('/api/draws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, draw_type: drawType }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Failed to create draw');
      toast.success(`Draw created for ${month}`);
      await onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create draw');
    } finally {
      setCreating(false);
    }
  }

  async function handleSimulate(draw: Draw) {
    setBusyDrawId(draw.id);
    try {
      const response = await fetch(`/api/draws/${draw.id}/simulate`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Simulation failed');
      setSimulation(data);
      setSimulationOpen(true);
      await onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Simulation failed');
    } finally {
      setBusyDrawId(null);
    }
  }

  async function openPublishDialog(draw: DrawWithMeta) {
    setBusyDrawId(draw.id);
    try {
      const response = await fetch(`/api/draws/${draw.id}/simulate`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Failed to preview publish');
      setPublishTarget(draw);
      setPublishPreview(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load preview');
    } finally {
      setBusyDrawId(null);
    }
  }

  async function handleRegenerate(draw: Draw) {
    setBusyDrawId(draw.id);
    try {
      const response = await fetch(`/api/draws/${draw.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate_numbers: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Regenerate failed');
      toast.success(`Numbers regenerated for ${draw.month}`);
      await onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Regenerate failed');
    } finally {
      setBusyDrawId(null);
    }
  }

  async function handleToggleDrawType(draw: Draw) {
    const nextType = nextDrawType(draw.draw_type);
    setBusyDrawId(draw.id);
    try {
      const response = await fetch(`/api/draws/${draw.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draw_type: nextType, regenerate_numbers: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Update failed');
      toast.success(`Draw switched to ${nextType}`);
      await onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setBusyDrawId(null);
    }
  }

  async function confirmDeleteDraw() {
    if (!deleteTarget) return;
    setDeleting(true);
    setBusyDrawId(deleteTarget.id);
    try {
      const response = await fetch(`/api/draws/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Delete failed');
      toast.success(`Draw ${deleteTarget.month} deleted`);
      setDeleteTarget(null);
      await onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setBusyDrawId(null);
      setDeleting(false);
    }
  }

  async function handlePublish() {
    if (!publishTarget) return;
    setBusyDrawId(publishTarget.id);
    try {
      const response = await fetch(`/api/draws/${publishTarget.id}/publish`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Publish failed');
      toast.success(`Draw ${publishTarget.month} published`);
      setPublishTarget(null);
      setPublishPreview(null);
      await onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Publish failed');
    } finally {
      setBusyDrawId(null);
    }
  }

  function totalWinners(draw: DrawWithMeta) {
    if (!draw.winner_counts) return '—';
    const total =
      draw.winner_counts['5-match'] +
      draw.winner_counts['4-match'] +
      draw.winner_counts['3-match'];
    return total;
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleCreateDraw}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-gray-900">Create Draw</h2>
        <p className="mt-1 text-sm text-gray-600">
          Generate monthly numbers from the active subscriber score pool.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Month
            </label>
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Draw type
            </label>
            <select
              value={drawType}
              onChange={(event) => setDrawType(event.target.value as DrawType)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="random">Random</option>
              <option value="algorithmic">Algorithmic (most frequent)</option>
              <option value="algorithmic_least">Algorithmic (least frequent)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating}
              className="btn-interactive inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {creating ? 'Creating…' : 'Create Draw'}
            </button>
          </div>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Draws</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-3 px-6 py-10 text-sm text-gray-500">
            <LoadingSpinner size="sm" />
            Loading draws…
          </div>
        ) : draws.length === 0 ? (
          <div className="px-6 py-10 text-sm text-gray-500">No draws yet.</div>
        ) : (
          <>
            <div className="divide-y divide-gray-100 md:hidden">
              {draws.map((draw) => (
                <article key={draw.id} className="dashboard-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{draw.month}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {drawTypeLabel(draw.draw_type)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs font-semibold capitalize',
                        STATUS_STYLES[draw.status],
                      )}
                    >
                      {draw.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">
                    Winners: <span className="font-medium text-gray-900">{totalWinners(draw)}</span>
                  </p>
                  <DrawRowActions
                    draw={draw}
                    busyDrawId={busyDrawId}
                    onSimulate={handleSimulate}
                    onPublish={openPublishDialog}
                    onRegenerate={handleRegenerate}
                    onToggleType={handleToggleDrawType}
                    onDelete={setDeleteTarget}
                    onView={setViewDraw}
                    className="mt-4 flex flex-wrap gap-2"
                  />
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Month</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Winners</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {draws.map((draw) => (
                    <tr key={draw.id} className="score-row-hover">
                      <td className="px-4 py-3 font-medium">{draw.month}</td>
                      <td className="px-4 py-3">{drawTypeLabel(draw.draw_type)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'rounded-full px-2 py-1 text-xs font-semibold capitalize',
                            STATUS_STYLES[draw.status],
                          )}
                        >
                          {draw.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{totalWinners(draw)}</td>
                      <td className="px-4 py-3">
                        <DrawRowActions
                          draw={draw}
                          busyDrawId={busyDrawId}
                          onSimulate={handleSimulate}
                          onPublish={openPublishDialog}
                          onRegenerate={handleRegenerate}
                          onToggleType={handleToggleDrawType}
                          onDelete={setDeleteTarget}
                          onView={setViewDraw}
                          className="flex justify-end gap-2"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <SimulationModal
        open={simulationOpen}
        onOpenChange={setSimulationOpen}
        simulation={simulation}
        title="Simulation Results"
      />

      <Dialog.Root
        open={publishTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPublishTarget(null);
            setPublishPreview(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <Dialog.Title className="text-lg font-semibold">
                Publish draw {publishTarget?.month}?
              </Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="rounded-md p-1 hover:bg-gray-100">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            {publishPreview && (
              <SimulationSummary simulation={publishPreview} className="mt-4" />
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={handlePublish}
                disabled={busyDrawId === publishTarget?.id}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Confirm Publish
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={viewDraw !== null} onOpenChange={(open) => !open && setViewDraw(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold">
              {viewDraw?.month} Results
            </Dialog.Title>
            {viewDraw && (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-gray-600">
                  Drawn numbers:{' '}
                  <span className="font-semibold text-gray-900">
                    {viewDraw.drawn_numbers.join(', ')}
                  </span>
                </p>
                <PrizePoolCard draw={viewDraw} />
                {viewDraw.winner_counts && (
                  <div className="text-sm text-gray-700">
                    <p>5-match: {viewDraw.winner_counts['5-match']}</p>
                    <p>4-match: {viewDraw.winner_counts['4-match']}</p>
                    <p>3-match: {viewDraw.winner_counts['3-match']}</p>
                  </div>
                )}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete draw?"
        description={`The draft draw for ${deleteTarget?.month} will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDeleteDraw}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function DrawRowActions({
  draw,
  busyDrawId,
  onSimulate,
  onPublish,
  onRegenerate,
  onToggleType,
  onDelete,
  onView,
  className,
}: {
  draw: DrawWithMeta;
  busyDrawId: string | null;
  onSimulate: (draw: Draw) => void;
  onPublish: (draw: DrawWithMeta) => void;
  onRegenerate: (draw: Draw) => void;
  onToggleType: (draw: Draw) => void;
  onDelete: (draw: Draw) => void;
  onView: (draw: DrawWithMeta) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      {(draw.status === 'draft' || draw.status === 'simulated') && (
        <>
          <button
            type="button"
            onClick={() => onSimulate(draw)}
            disabled={busyDrawId === draw.id}
            className="btn-interactive inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium hover:bg-gray-50"
          >
            <Play className="h-3.5 w-3.5" />
            Simulate
          </button>
          <button
            type="button"
            onClick={() => onRegenerate(draw)}
            disabled={busyDrawId === draw.id}
            className="btn-interactive inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium hover:bg-gray-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate
          </button>
          <button
            type="button"
            onClick={() => onToggleType(draw)}
            disabled={busyDrawId === draw.id}
            className="btn-interactive inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium hover:bg-gray-50"
          >
            {drawTypeLabel(nextDrawType(draw.draw_type))}
          </button>
          <button
            type="button"
            onClick={() => onPublish(draw)}
            disabled={busyDrawId === draw.id}
            className="btn-interactive inline-flex items-center gap-1 rounded-md border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
          >
            <Rocket className="h-3.5 w-3.5" />
            Publish
          </button>
          <button
            type="button"
            onClick={() => onDelete(draw)}
            disabled={busyDrawId === draw.id}
            className="btn-interactive inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </>
      )}
      {draw.status === 'published' && (
        <button
          type="button"
          onClick={() => onView(draw)}
          className="btn-interactive inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium hover:bg-gray-50"
        >
          <Eye className="h-3.5 w-3.5" />
          View Results
        </button>
      )}
    </div>
  );
}

function PrizePoolCard({ draw }: { draw: Draw }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
      <h3 className="font-semibold text-gray-900">Prize pool breakdown</h3>
      <ul className="mt-2 space-y-1 text-gray-700">
        <li>Jackpot (40%): {formatCurrency(Number(draw.jackpot_amount))}</li>
        <li>4-match pool (35%): {formatCurrency(Number(draw.pool_4match))}</li>
        <li>3-match pool (25%): {formatCurrency(Number(draw.pool_3match))}</li>
        <li>Rollover in: {formatCurrency(Number(draw.rollover_amount))}</li>
      </ul>
    </div>
  );
}

function SimulationSummary({
  simulation,
  className,
}: {
  simulation: SimulationResponse;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3 text-sm', className)}>
      <p>
        Drawn numbers:{' '}
        <span className="font-semibold">{simulation.drawn_numbers.join(', ')}</span>
      </p>
      <p>Subscribers: {simulation.summary.total_subscribers}</p>
      <p>5-match winners: {simulation.summary['5_match_winners']}</p>
      <p>4-match winners: {simulation.summary['4_match_winners']}</p>
      <p>3-match winners: {simulation.summary['3_match_winners']}</p>
      {simulation.summary.jackpot_rolls_over && (
        <p className="font-medium text-amber-700">
          No 5-match winner — jackpot rolls over next month.
        </p>
      )}
      <div className="rounded-lg border bg-gray-50 p-3">
        <p>Jackpot pool: {formatCurrency(simulation.prize_breakdown.jackpot)}</p>
        <p>
          Each 4-match winner:{' '}
          {formatCurrency(simulation.prize_breakdown.each_4match_winner)}
        </p>
        <p>
          Each 3-match winner:{' '}
          {formatCurrency(simulation.prize_breakdown.each_3match_winner)}
        </p>
      </div>
    </div>
  );
}

function SimulationModal({
  open,
  onOpenChange,
  simulation,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  simulation: SimulationResponse | null;
  title: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-white p-6 shadow-xl">
          <div className="flex items-start justify-between">
            <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="rounded-md p-1 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          {simulation && <SimulationSummary simulation={simulation} className="mt-4" />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
