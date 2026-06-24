import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  getCharityWithContribution,
  getDrawHistory,
  getNextDrawInfo,
  getProfile,
  getScores,
  getWinningsSummary,
} from '@/lib/dashboard/data';
import { getWinnerDisplayStatus } from '@/lib/winners/helpers';
import { CharityDashboardCard } from '@/components/dashboard/CharityDashboardCard';
import { DrawHistory } from '@/components/dashboard/DrawHistory';
import { DrawParticipationCard } from '@/components/dashboard/DrawParticipationCard';
import { ScoreEntry } from '@/components/dashboard/ScoreEntry';
import { StatCards } from '@/components/dashboard/StatCards';
import { WinnerProofUpload } from '@/components/dashboard/WinnerProofUpload';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [profile, scores, charityData, drawHistory, winnings, nextDraw] =
    await Promise.all([
      getProfile(user.id),
      getScores(user.id),
      getCharityWithContribution(user.id),
      getDrawHistory(user.id),
      getWinningsSummary(user.id),
      getNextDrawInfo(),
    ]);

  if (!profile) redirect('/login');

  const pendingProofWinners = winnings.entries.filter(
    ({ entry }) => {
      const status = getWinnerDisplayStatus(entry);
      return status === 'pending' || status === 'under_review' || status === 'rejected';
    },
  );

  const drawEntryScores = scores
    .slice()
    .sort((a, b) => b.score_date.localeCompare(a.score_date))
    .slice(0, 5);

  const isEntered =
    profile.subscription_status === 'active' && drawEntryScores.length === 5;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Your subscription, scores, charity, and draw activity at a glance.
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

      <StatCards
        profile={profile}
        nextDraw={nextDraw}
        winnings={winnings}
        charity={charityData}
      />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7">
          <ScoreEntry initialScores={scores} />
        </div>
        <div className="col-span-12 lg:col-span-5">
          <CharityDashboardCard profile={profile} charityData={charityData} />
        </div>
      </div>

      <DrawParticipationCard
        nextDraw={nextDraw}
        scores={scores}
        isEntered={isEntered}
        drawHistory={drawHistory}
      />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Draw history</h2>
        </div>
        <DrawHistory draws={drawHistory} />
      </section>
    </div>
  );
}
