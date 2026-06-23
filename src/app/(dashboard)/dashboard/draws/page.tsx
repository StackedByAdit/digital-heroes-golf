import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDrawHistory } from '@/lib/dashboard/data';
import { DrawHistory } from '@/components/dashboard/DrawHistory';

export default async function DrawsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const draws = await getDrawHistory(user.id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Draw History</h1>
        <p className="mt-1 text-sm text-gray-600">
          Monthly draws and your match results.
        </p>
      </div>
      <DrawHistory draws={draws} />
    </div>
  );
}
