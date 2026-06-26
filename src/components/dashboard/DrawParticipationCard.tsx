import Link from 'next/link';
import { cn, formatCurrency } from '@/lib/utils';
import { REQUIRED_SCORE_COUNT } from '@/lib/subscription/access';
import type { NextDrawInfo } from '@/lib/dashboard/data';
import type { DrawWithMeta } from '@/lib/draw/processing';
import type { GolfScore } from '@/types';

interface DrawParticipationCardProps {
  nextDraw: NextDrawInfo;
  scores: GolfScore[];
  isEntered: boolean;
  drawHistory: DrawWithMeta[];
  drawsEntered: number;
}

export function DrawParticipationCard({
  nextDraw,
  scores,
  isEntered,
  drawHistory,
  drawsEntered,
}: DrawParticipationCardProps) {
  const recentDraws = drawHistory.filter((draw) => draw.my_entry).slice(0, 3);
  const drawScores = scores
    .slice()
    .sort((a, b) => b.score_date.localeCompare(a.score_date))
    .slice(0, REQUIRED_SCORE_COUNT)
    .slice()
    .sort((a, b) => a.score_date.localeCompare(b.score_date))
    .map((score) => score.score);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Participation</h2>
          <p className="mt-1 text-sm text-gray-600">
            {drawsEntered} draw{drawsEntered === 1 ? '' : 's'} entered · Upcoming:{' '}
            {nextDraw.label}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold',
            isEntered
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-gray-100 text-gray-600'
          )}
        >
          {isEntered
            ? 'You are entered for this draw'
            : drawScores.length < REQUIRED_SCORE_COUNT
              ? `Add ${REQUIRED_SCORE_COUNT - drawScores.length} more score${REQUIRED_SCORE_COUNT - drawScores.length === 1 ? '' : 's'} to enter`
              : 'Subscribe to enter this draw'}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700">Estimated prize pool</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {formatCurrency(nextDraw.estimatedPool)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Based on {nextDraw.subscriberCount} subscribers
            {nextDraw.rolloverAmount > 0 &&
              ` + ${formatCurrency(nextDraw.rolloverAmount)} rollover`}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700">
            Your scores for this draw
          </p>
          <p className="mt-2 font-mono text-sm text-gray-900">
            {drawScores.length > 0 ? drawScores.join(', ') : 'No scores yet'}
          </p>
          <Link
            href="/dashboard/scores"
            className="mt-2 inline-block text-xs font-semibold text-emerald-700"
          >
            Manage scores →
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-900">Recent draws</h3>
        {recentDraws.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No draw history yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recentDraws.map((draw) => {
              const entry = draw.my_entry!;
              return (
                <li
                  key={draw.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{draw.month}</span>
                  <span className="text-gray-600">
                    Match: {entry.match_type ?? 'None'}
                  </span>
                  <span className="font-semibold text-emerald-700">
                    {entry.prize_amount > 0
                      ? formatCurrency(Number(entry.prize_amount))
                      : '—'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
