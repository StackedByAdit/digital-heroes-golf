import { redirect } from 'next/navigation';
import { getDashboardOverview } from '@/lib/dashboard/data';
import { getWinnerDisplayStatus } from '@/lib/winners/helpers';
import { isDrawEligible, REQUIRED_SCORE_COUNT } from '@/lib/subscription/access';
import { getAuthUser } from '@/lib/supabase/cached-auth';
import { CharityDashboardCard } from '@/components/dashboard/CharityDashboardCard';
import { DrawHistory } from '@/components/dashboard/DrawHistory';
import { DrawParticipationCard } from '@/components/dashboard/DrawParticipationCard';
import { ScoreEntry } from '@/components/dashboard/ScoreEntry';
import { StatCards } from '@/components/dashboard/StatCards';
import { SubscriptionStatus } from '@/components/dashboard/SubscriptionStatus';
import { WinnerProofUpload } from '@/components/dashboard/WinnerProofUpload';

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const overview = await getDashboardOverview(user.id);
  if (!overview) redirect('/login');

  const { profile, scores, charityData, drawHistory, winnings, nextDraw } =
    overview;

  const pendingProofWinners = winnings.entries.filter(({ entry }) => {
    const status = getWinnerDisplayStatus(entry);
    return status === 'pending' || status === 'under_review' || status === 'rejected';
  });

  const drawEntryScores = scores
    .slice()
    .sort((a, b) => b.score_date.localeCompare(a.score_date))
    .slice(0, REQUIRED_SCORE_COUNT);

  const isEntered = isDrawEligible(
    profile.subscription_status,
    drawEntryScores.length,
    profile.subscription_ends_at,
  );

  const scoresNeeded = Math.max(0, REQUIRED_SCORE_COUNT - drawEntryScores.length);
  const drawsEntered = drawHistory.filter((draw) => draw.my_entry).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Your subscription, scores, charity, and draw activity at a glance.
        </p>
      </div>

      {scoresNeeded > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You need {scoresNeeded} more score{scoresNeeded === 1 ? '' : 's'} to enter
          the monthly draw. Your last {REQUIRED_SCORE_COUNT} Stableford scores become
          your draw numbers.
        </div>
      )}

      {pendingProofWinners.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Winner verification
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Upload a screenshot of your scores from your golf platform so we can
              verify and pay your prize.
            </p>
          </div>
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
        drawsEntered={drawsEntered}
      />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-7">
          <SubscriptionStatus
            plan={profile.subscription_plan}
            status={profile.subscription_status}
            renewalDate={profile.renewalDate}
          />
        </div>
        <div className="col-span-12 xl:col-span-5">
          <CharityDashboardCard profile={profile} charityData={charityData} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7">
          <ScoreEntry initialScores={scores} />
        </div>
        <div className="col-span-12 lg:col-span-5">
          <DrawParticipationCard
            nextDraw={nextDraw}
            scores={scores}
            isEntered={isEntered}
            drawHistory={drawHistory}
            drawsEntered={drawsEntered}
          />
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Draw history</h2>
        </div>
        <DrawHistory draws={drawHistory} />
      </section>
    </div>
  );
}
