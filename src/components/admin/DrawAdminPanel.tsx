'use client';

import { addMonths, format } from 'date-fns';
import { CalendarPlus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DrawManager } from '@/components/admin/DrawManager';
import { cn, formatCurrency, getMonthKey } from '@/lib/utils';
import type { DrawStatus } from '@/types';
import type { DrawWithMeta } from '@/lib/draw/processing';

const STATUS_COLORS: Record<DrawStatus, string> = {
  draft: 'bg-gray-200 text-gray-700',
  simulated: 'bg-blue-100 text-blue-800',
  published: 'bg-emerald-100 text-emerald-800',
};

export function DrawAdminPanel() {
  const [draws, setDraws] = useState<DrawWithMeta[]>([]);
  const [currentRollover, setCurrentRollover] = useState(0);
  const [creatingNext, setCreatingNext] = useState(false);
  const year = new Date().getFullYear();

  const loadMeta = useCallback(async () => {
    try {
      const [drawsRes, statsRes] = await Promise.all([
        fetch('/api/draws'),
        fetch('/api/admin/stats'),
      ]);
      const drawsData = await drawsRes.json();
      const statsData = await statsRes.json();

      if (drawsRes.ok) setDraws(drawsData.draws ?? []);
      if (statsRes.ok) setCurrentRollover(statsData.current_rollover ?? 0);
    } catch {
      /* DrawManager handles its own errors */
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const drawByMonth = new Map(draws.map((draw) => [draw.month, draw]));
  const months = Array.from({ length: 12 }, (_, index) => {
    const monthDate = new Date(year, index, 1);
    const key = format(monthDate, 'yyyy-MM');
    return {
      key,
      label: format(monthDate, 'MMM'),
      draw: drawByMonth.get(key),
    };
  });

  async function createNextMonthDraw() {
    const nextMonth = getMonthKey(addMonths(new Date(), 1));
    setCreatingNext(true);
    try {
      const response = await fetch('/api/draws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: nextMonth, draw_type: 'random' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Failed to create draw');
      toast.success(`Draw created for ${nextMonth}`);
      await loadMeta();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create draw');
    } finally {
      setCreatingNext(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Jackpot rollover</h2>
          <p className="mt-1 text-sm text-gray-600">
            Accumulated jackpot carried forward from the latest published draw.
          </p>
          <p className="mt-4 text-3xl font-bold text-amber-700">
            {formatCurrency(currentRollover)}
          </p>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Quick actions</h2>
          <p className="mt-1 text-sm text-gray-600">
            Create a draft draw for next month with one click.
          </p>
          <button
            type="button"
            onClick={createNextMonthDraw}
            disabled={creatingNext}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            <CalendarPlus className="h-4 w-4" />
            {creatingNext ? 'Creating…' : "Create Next Month's Draw"}
          </button>
        </section>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{year} draw calendar</h2>
        <p className="mt-1 text-sm text-gray-600">
          Month grid showing draw status across the year.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {months.map((month) => (
            <div
              key={month.key}
              className={cn(
                'rounded-lg border p-3 text-center',
                month.draw ? 'border-gray-200' : 'border-dashed border-gray-200 bg-gray-50'
              )}
            >
              <p className="text-sm font-semibold text-gray-900">{month.label}</p>
              {month.draw ? (
                <span
                  className={cn(
                    'mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                    STATUS_COLORS[month.draw.status]
                  )}
                >
                  {month.draw.status}
                </span>
              ) : (
                <span className="mt-2 inline-block text-xs text-gray-400">No draw</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <DrawManager />
    </div>
  );
}
