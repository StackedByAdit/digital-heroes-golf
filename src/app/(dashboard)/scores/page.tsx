import { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ScoreEntry } from '@/components/dashboard/ScoreEntry';
import type { GolfScore } from '@/types';

async function getScores(userId: string): Promise<GolfScore[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('golf_scores')
    .select('*')
    .eq('user_id', userId)
    .order('score_date', { ascending: false });

  if (error) {
    console.error('[scores page]', error);
    return [];
  }

  return (data ?? []) as GolfScore[];
}

function ScoresSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded bg-gray-200" />
      <div className="h-4 w-72 rounded bg-gray-100" />
      <div className="h-40 rounded-xl bg-gray-100" />
      <div className="h-64 rounded-xl bg-gray-100" />
    </div>
  );
}

async function ScoresContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const scores = user ? await getScores(user.id) : [];

  return <ScoreEntry initialScores={scores} />;
}

export default function ScoresPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/dashboard" className="hover:text-gray-900">
              Dashboard
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-gray-900">Scores</li>
        </ol>
      </nav>

      <Suspense fallback={<ScoresSkeleton />}>
        <ScoresContent />
      </Suspense>
    </main>
  );
}
