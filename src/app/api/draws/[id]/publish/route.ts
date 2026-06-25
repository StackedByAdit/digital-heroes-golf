import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  applyJackpotRollover,
  applyPrizePoolsToDraw,
  buildSimulation,
  eligibleDrawSubscribers,
  fetchActiveSubscribersWithScores,
  requireAdmin,
} from '@/lib/draw/processing';
import { notifyDrawResultEmails } from '@/lib/email/notifications';
import { createUserNotification } from '@/lib/notifications/service';
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

    const { data: existingDraw, error: drawError } = await admin
      .from('draws')
      .select('*')
      .eq('id', id)
      .single();

    if (drawError || !existingDraw) {
      return NextResponse.json({ error: 'Draw not found' }, { status: 404 });
    }

    if (existingDraw.status !== 'draft' && existingDraw.status !== 'simulated') {
      return NextResponse.json(
        { error: 'Only draft or simulated draws can be published' },
        { status: 400 }
      );
    }

    const draw = await applyPrizePoolsToDraw(id, existingDraw.month);

    const subscribers = eligibleDrawSubscribers(
      await fetchActiveSubscribersWithScores()
    );
    const simulation = buildSimulation(draw, subscribers);

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

    notifyDrawResultEmails(draw.month, subscribers, simulation.entries);

    for (const entry of simulation.entries) {
      if (entry.prize_amount > 0) {
        await createUserNotification({
          userId: entry.user_id,
          type: 'winner',
          title: `You won the ${draw.month} draw!`,
          body: `You matched ${entry.match_type ?? 'numbers'} and won £${entry.prize_amount.toFixed(2)}. Upload proof to claim your prize.`,
          href: '/dashboard',
        });
      }
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
