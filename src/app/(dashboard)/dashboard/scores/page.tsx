import { redirect } from 'next/navigation';
import { getScores } from '@/lib/dashboard/data';
import { getAuthUser } from '@/lib/supabase/cached-auth';
import { ScoreEntry } from '@/components/dashboard/ScoreEntry';

export default async function ScoresPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const scores = await getScores(user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Scores</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your five most recent golf scores for draw matching.
        </p>
      </div>
      <ScoreEntry initialScores={scores} />
    </div>
  );
}
