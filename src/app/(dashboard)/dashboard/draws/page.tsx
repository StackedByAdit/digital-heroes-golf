import { redirect } from 'next/navigation';
import { getDrawHistory, getWinningsSummary } from '@/lib/dashboard/data';
import { getWinnerDisplayStatus } from '@/lib/winners/helpers';
import { getAuthUser } from '@/lib/supabase/cached-auth';
import { DrawHistory } from '@/components/dashboard/DrawHistory';
import { WinnerProofUpload } from '@/components/dashboard/WinnerProofUpload';

export default async function DrawsPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const [draws, winnings] = await Promise.all([
    getDrawHistory(user.id),
    getWinningsSummary(user.id),
  ]);

  const pendingProofWinners = winnings.entries.filter(({ entry }) => {
    const status = getWinnerDisplayStatus(entry);
    return status === 'pending' || status === 'under_review' || status === 'rejected';
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Draw History</h1>
        <p className="mt-1 text-sm text-gray-600">
          Monthly draws, match results, and winner verification.
        </p>
      </div>

      {pendingProofWinners.length > 0 && (
        <div className="space-y-4">
          {pendingProofWinners.map(({ entry, drawMonth }) => (
            <WinnerProofUpload
              key={entry.id}
              id={`winner-${entry.id}`}
              entry={entry}
              drawMonth={drawMonth}
            />
          ))}
        </div>
      )}

      <DrawHistory draws={draws} />
    </div>
  );
}
