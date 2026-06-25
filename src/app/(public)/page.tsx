import { createClient } from '@/lib/supabase/server';
import { FAIRWAY_FUTURES_CHARITY_ID } from '@/lib/charity/helpers';
import { attachEventsToCharities } from '@/lib/charity/server';
import { getPublicStats } from '@/lib/public/stats';
import { createPageMetadata } from '@/lib/seo/metadata';
import { HomePageContent } from '@/components/public/HomePageContent';

export const metadata = createPageMetadata(
  'Home',
  'Play golf, win monthly prizes, and support your favourite charity with Digital Heroes Golf.',
);

export const dynamic = 'force-dynamic';

async function getFeaturedCharity() {
  const supabase = await createClient();

  let { data } = await supabase
    .from('charities')
    .select('*')
    .eq('id', FAIRWAY_FUTURES_CHARITY_ID)
    .eq('is_active', true)
    .eq('is_featured', true)
    .maybeSingle();

  if (!data) {
    ({ data } = await supabase
      .from('charities')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(1)
      .maybeSingle());
  }

  if (!data) return null;

  const [charity] = await attachEventsToCharities(supabase, [data], true);
  return charity;
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [stats, featuredCharity] = await Promise.all([
    getPublicStats(),
    getFeaturedCharity(),
  ]);

  return (
    <HomePageContent
      stats={stats}
      featuredCharity={featuredCharity}
      initialAuthenticated={Boolean(user)}
    />
  );
}
