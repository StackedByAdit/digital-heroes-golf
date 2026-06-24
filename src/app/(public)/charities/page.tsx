import { createClient } from '@/lib/supabase/server';
import { attachEventsToCharities } from '@/lib/charity/server';
import { CharitiesDirectory } from '@/components/public/CharitiesDirectory';

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
  const featuredCharity = charities.find((charity) => charity.is_featured) ?? null;

  return (
    <main className="container mx-auto px-4 py-8">
      <CharitiesDirectory charities={charities} featuredCharity={featuredCharity} />
    </main>
  );
}
