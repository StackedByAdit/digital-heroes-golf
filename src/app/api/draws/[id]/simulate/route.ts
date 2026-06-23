import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  buildSimulation,
  fetchActiveSubscribersWithScores,
  requireAdmin,
} from '@/lib/draw/processing';
import type { Draw } from '@/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const admin = createAdminClient();

    const { data: draw, error: drawError } = await admin
      .from('draws')
      .select('*')
      .eq('id', id)
      .single();

    if (drawError || !draw) {
      return NextResponse.json({ error: 'Draw not found' }, { status: 404 });
    }

    if (draw.status === 'published') {
      return NextResponse.json(
        { error: 'Published draws cannot be simulated' },
        { status: 400 }
      );
    }

    const subscribers = await fetchActiveSubscribersWithScores();
    const simulation = buildSimulation(draw as Draw, subscribers);

    await admin
      .from('draws')
      .update({ status: 'simulated' })
      .eq('id', id);

    const { entries, ...responseBody } = simulation;
    void entries;

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('[draw simulate]', error);
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 });
  }
}
