import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CharitySelector } from '@/components/dashboard/CharitySelector';
import type { Charity, Profile } from '@/types';

async function getCharityData(userId: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile) return { profile: null, charity: null };

  let charity: Charity | null = null;
  if (profile.charity_id) {
    const { data } = await supabase
      .from('charities')
      .select('*')
      .eq('id', profile.charity_id)
      .maybeSingle();
    charity = data as Charity | null;
  }

  return { profile: profile as Profile, charity };
}

export default async function CharityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { profile, charity } = user
    ? await getCharityData(user.id)
    : { profile: null, charity: null };

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
          <li className="font-medium text-gray-900">My Charity</li>
        </ol>
      </nav>

      <h1 className="mb-6 text-3xl font-bold">My Charity</h1>

      {profile ? (
        <CharitySelector profile={profile} currentCharity={charity} />
      ) : (
        <p className="text-sm text-gray-500">Please sign in to manage your charity.</p>
      )}
    </main>
  );
}
