import { redirect } from 'next/navigation';
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

  if (!user) redirect('/login');

  const { profile, charity } = await getCharityData(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Charity</h1>
        <p className="mt-1 text-sm text-gray-600">
          Choose your charity and set your contribution percentage.
        </p>
      </div>

      {profile ? (
        <CharitySelector profile={profile} currentCharity={charity} />
      ) : (
        <p className="text-sm text-gray-500">Profile not found.</p>
      )}
    </div>
  );
}
