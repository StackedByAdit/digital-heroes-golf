import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { DrawHistory } from '@/components/dashboard/DrawHistory';
import type { DrawWithMeta } from '@/lib/draw/processing';
import type { Draw } from '@/types';

async function getUserDraws(userId: string): Promise<DrawWithMeta[]> {
  const supabase = await createClient();

  const { data: draws, error } = await supabase
    .from('draws')
    .select('*')
    .eq('status', 'published')
    .order('month', { ascending: false });

  if (error || !draws) return [];

  const enriched: DrawWithMeta[] = [];

  for (const draw of draws as Draw[]) {
    const { data: entry } = await supabase
      .from('draw_entries')
      .select('*')
      .eq('draw_id', draw.id)
      .eq('user_id', userId)
      .maybeSingle();

    enriched.push({ ...draw, my_entry: entry });
  }

  return enriched;
}

export default async function DrawsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const draws = user ? await getUserDraws(user.id) : [];

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
          <li className="font-medium text-gray-900">Draws</li>
        </ol>
      </nav>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Draw History</h1>
        <p className="mt-2 text-sm text-gray-600">
          Monthly draws and your match results.
        </p>
      </div>

      <DrawHistory draws={draws} />
    </main>
  );
}
