import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  applyJackpotRollover,
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

    if (draw.status !== 'draft' && draw.status !== 'simulated') {
      return NextResponse.json(
        { error: 'Only draft or simulated draws can be published' },
        { status: 400 }
      );
    }

    const subscribers = await fetchActiveSubscribersWithScores();
    const simulation = buildSimulation(draw as Draw, subscribers);

    await admin.from('draw_entries').delete().eq('draw_id', id);

    const entryRows = simulation.entries.map((entry) => ({
      draw_id: id,
      user_id: entry.user_id,
      user_scores: entry.user_scores,
      match_type: entry.match_type,
      prize_amount: entry.prize_amount,
      payment_status: entry.prize_amount > 0 ? 'pending' : 'pending',
    }));

    if (entryRows.length > 0) {
      const { error: insertError } = await admin
        .from('draw_entries')
        .insert(entryRows);

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    const { data: publishedDraw, error: publishError } = await admin
      .from('draws')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (publishError) {
      throw new Error(publishError.message);
    }

    await applyJackpotRollover(draw as Draw, simulation);

    for (const entry of simulation.entries.filter((item) => item.prize_amount > 0)) {
      const subscriber = subscribers.find(
        (item) => item.profile.id === entry.user_id
      );
      // TODO: integrate email provider (Resend, SendGrid, etc.)
      console.log('[draw publish] Winner notification stub', {
        email: subscriber?.profile.email,
        userId: entry.user_id,
        drawMonth: draw.month,
        matchType: entry.match_type,
        prizeAmount: entry.prize_amount,
      });
    }

    return NextResponse.json({
      draw: publishedDraw,
      summary: simulation.summary,
      prize_breakdown: simulation.prize_breakdown,
    });
  } catch (error) {
    console.error('[draw publish]', error);
    return NextResponse.json({ error: 'Failed to publish draw' }, { status: 500 });
  }
}
