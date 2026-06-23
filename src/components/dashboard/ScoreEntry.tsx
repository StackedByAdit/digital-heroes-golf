'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { format } from 'date-fns';
import { Minus, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { cn, formatDate } from '@/lib/utils';
import type { GolfScore } from '@/types';

interface ScoreEntryProps {
  initialScores: GolfScore[];
}

type FormMode = 'add' | 'edit' | null;

function todayString() {
  return format(new Date(), 'yyyy-MM-dd');
}

function getOldestScore(scores: GolfScore[]): GolfScore | null {
  if (scores.length === 0) return null;
  return [...scores].sort(
    (a, b) => new Date(a.score_date).getTime() - new Date(b.score_date).getTime()
  )[0];
}

export function ScoreEntry({ initialScores }: ScoreEntryProps) {
  const [scores, setScores] = useState<GolfScore[]>(initialScores);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scoreDate, setScoreDate] = useState(todayString());
  const [scoreValue, setScoreValue] = useState(36);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GolfScore | null>(null);
  const [deleting, setDeleting] = useState(false);

  const oldestScore = useMemo(() => getOldestScore(scores), [scores]);
  const atCapacity = scores.length >= 5;

  function resetForm() {
    setFormMode(null);
    setEditingId(null);
    setScoreDate(todayString());
    setScoreValue(36);
    setFormError(null);
  }

  function openAddForm() {
    setFormMode('add');
    setEditingId(null);
    setScoreDate(todayString());
    setScoreValue(36);
    setFormError(null);
  }

  function openEditForm(entry: GolfScore) {
    setFormMode('edit');
    setEditingId(entry.id);
    setScoreDate(entry.score_date);
    setScoreValue(entry.score);
    setFormError(null);
  }

  function adjustScore(delta: number) {
    setScoreValue((current) => Math.min(45, Math.max(1, current + delta)));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const payload =
      formMode === 'edit' && editingId
        ? { id: editingId, score: scoreValue, score_date: scoreDate }
        : { score: scoreValue, score_date: scoreDate };

    const previousScores = scores;
    let optimisticScores = scores;

    if (formMode === 'add') {
      const tempId = `temp-${Date.now()}`;
      const optimisticEntry: GolfScore = {
        id: tempId,
        user_id: '',
        score: scoreValue,
        score_date: scoreDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      optimisticScores = [optimisticEntry, ...scores]
        .filter((entry) => !(atCapacity && entry.id === oldestScore?.id))
        .sort(
          (a, b) =>
            new Date(b.score_date).getTime() - new Date(a.score_date).getTime()
        )
        .slice(0, 5);

      setScores(optimisticScores);
    } else if (formMode === 'edit' && editingId) {
      optimisticScores = scores
        .map((entry) =>
          entry.id === editingId
            ? {
                ...entry,
                score: scoreValue,
                score_date: scoreDate,
                updated_at: new Date().toISOString(),
              }
            : entry
        )
        .sort(
          (a, b) =>
            new Date(b.score_date).getTime() - new Date(a.score_date).getTime()
        );
      setScores(optimisticScores);
    }

    try {
      const response = await fetch('/api/scores', {
        method: formMode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setScores(previousScores);
        setFormError(data.error ?? 'Failed to save score');
        toast.error(data.error ?? 'Failed to save score');
        return;
      }

      setScores(data.scores);
      toast.success(
        formMode === 'edit' ? 'Score updated successfully' : 'Score added successfully'
      );
      resetForm();
    } catch {
      setScores(previousScores);
      setFormError('Something went wrong. Please try again.');
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    const previousScores = scores;
    setScores((current) => current.filter((entry) => entry.id !== deleteTarget.id));

    try {
      const response = await fetch('/api/scores', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        setScores(previousScores);
        toast.error(data.error ?? 'Failed to delete score');
        return;
      }

      setScores(data.scores);
      toast.success('Score deleted');
      setDeleteTarget(null);
    } catch {
      setScores(previousScores);
      toast.error('Failed to delete score');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Golf Scores</h2>
          <p className="mt-1 text-sm text-gray-600">
            Enter your Stableford scores (1–45)
          </p>
        </div>
        {!formMode && (
          <button
            type="button"
            onClick={openAddForm}
            className="btn-interactive inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            {atCapacity ? 'Replace Oldest' : 'Add Score'}
          </button>
        )}
      </div>

      {atCapacity && oldestScore && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Adding a new score will remove your oldest score (
          <span className="font-semibold">{formatDate(oldestScore.score_date)}</span>
          ).
        </div>
      )}

      {formMode && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {formMode === 'edit' ? 'Edit Score' : 'Add Score'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md p-1 text-gray-500 hover:bg-gray-200"
              aria-label="Close form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="score-date"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Date
              </label>
              <input
                id="score-date"
                type="date"
                max={todayString()}
                value={scoreDate}
                onChange={(event) => setScoreDate(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label
                htmlFor="score-value"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Stableford Score
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustScore(-1)}
                  className="rounded-lg border border-gray-300 p-2 hover:bg-white"
                  aria-label="Decrease score"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  id="score-value"
                  type="number"
                  min={1}
                  max={45}
                  value={scoreValue}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (!Number.isNaN(next)) {
                      setScoreValue(Math.min(45, Math.max(1, next)));
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => adjustScore(1)}
                  className="rounded-lg border border-gray-300 p-2 hover:bg-white"
                  aria-label="Increase score"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {formError && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {formError}
            </p>
          )}

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="btn-interactive rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting
                ? 'Saving…'
                : formMode === 'edit'
                  ? 'Update Score'
                  : atCapacity
                    ? 'Replace Oldest & Save'
                    : 'Save Score'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {scores.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            No scores yet. Add your first score below.
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100 md:hidden">
              {scores.map((entry) => {
                const isOldestCandidate =
                  atCapacity && oldestScore?.id === entry.id;

                return (
                  <article
                    key={entry.id}
                    className={cn(
                      'score-row-hover p-4',
                      isOldestCandidate && 'bg-amber-50/70',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatDate(entry.score_date)}
                        </p>
                        {isOldestCandidate && (
                          <p className="mt-1 text-xs font-medium text-amber-700">
                            Will be replaced on next add
                          </p>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{entry.score}</p>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(entry)}
                        className="btn-interactive inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-gray-200 px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(entry)}
                        className="btn-interactive inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-red-200 px-2 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Score
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {scores.map((entry) => {
                    const isOldestCandidate =
                      atCapacity && oldestScore?.id === entry.id;

                    return (
                      <tr
                        key={entry.id}
                        className={cn(
                          'score-row-hover',
                          isOldestCandidate && 'bg-amber-50/70',
                        )}
                      >
                        <td className="px-4 py-3 text-gray-900">
                          <div className="flex flex-col">
                            <span>{formatDate(entry.score_date)}</span>
                            {isOldestCandidate && (
                              <span className="text-xs font-medium text-amber-700">
                                Will be replaced on next add
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {entry.score}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(entry)}
                              className="btn-interactive inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(entry)}
                              className="btn-interactive inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Dialog.Root
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Delete score?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-gray-600">
              {deleteTarget
                ? `Remove the score from ${formatDate(deleteTarget.score_date)}? This cannot be undone.`
                : 'Remove this score?'}
            </Dialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
