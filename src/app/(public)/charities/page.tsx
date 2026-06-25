import { createClient } from '@/lib/supabase/server';
import { pickFeaturedCharity } from '@/lib/charity/helpers';
import { attachEventsToCharities } from '@/lib/charity/server';
import { createPageMetadata } from '@/lib/seo/metadata';
import { CharitiesDirectory } from '@/components/public/CharitiesDirectory';

export const metadata = createPageMetadata(
  'Charities',
  'Discover partner charities supported by Digital Heroes Golf members and see the impact of every subscription.',
);

async function getCharities() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('charities')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error || !data) return [];

  return attachEventsToCharities(supabase, data, true);
}

export default async function CharitiesPage() {
  const charities = await getCharities();
  const featuredCharity = pickFeaturedCharity(charities);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <CharitiesDirectory charities={charities} featuredCharity={featuredCharity} />
    </div>
  );
}
