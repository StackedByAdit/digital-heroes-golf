import type { SupabaseClient } from '@supabase/supabase-js';
import type { Charity, CharityEvent } from '@/types';

export type CharityWithEvents = Charity;

export async function fetchEventsForCharity(
  supabase: SupabaseClient,
  charityId: string,
  upcomingOnly = false
): Promise<CharityEvent[]> {
  let query = supabase
    .from('charity_events')
    .select('*')
    .eq('charity_id', charityId)
    .order('event_date', { ascending: true });

  if (upcomingOnly) {
    const today = new Date().toISOString().slice(0, 10);
    query = query.gte('event_date', today);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as CharityEvent[];
}

export async function attachEventsToCharities(
  supabase: SupabaseClient,
  charities: Omit<Charity, 'upcoming_events'>[],
  upcomingOnly = true
): Promise<CharityWithEvents[]> {
  const results: CharityWithEvents[] = [];

  for (const charity of charities) {
    const events = await fetchEventsForCharity(supabase, charity.id, upcomingOnly);
    results.push({ ...charity, upcoming_events: events });
  }

  return results;
}
