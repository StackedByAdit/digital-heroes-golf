import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  fetchActiveSubscribersWithScores,
  flattenScorePool,
  generateDrawNumbers,
  prizePoolsForSubscribers,
  requireAdmin,
  resolveRolloverForMonth,
} from '@/lib/draw/processing';
import { UpdateDrawSchema } from '@/lib/validations';
import type { Draw } from '@/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = UpdateDrawSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const { data: draw, error: fetchError } = await admin
      .from('draws')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !draw) {
      return NextResponse.json({ error: 'Draw not found' }, { status: 404 });
    }

    if (draw.status === 'published') {
      return NextResponse.json(
        { error: 'Published draws cannot be modified' },
        { status: 409 }
      );
    }

    const drawType = parsed.data.draw_type ?? draw.draw_type;
    const shouldRegenerate =
      parsed.data.regenerate_numbers === true ||
      (parsed.data.draw_type && parsed.data.draw_type !== draw.draw_type);

    const update: Partial<Draw> = {};

    if (parsed.data.draw_type) {
      update.draw_type = parsed.data.draw_type;
    }

    if (shouldRegenerate) {
      const subscribers = await fetchActiveSubscribersWithScores();
      const scorePool = flattenScorePool(subscribers);
      update.drawn_numbers = generateDrawNumbers(drawType, scorePool);

      const rolloverAmount = await resolveRolloverForMonth(draw.month);
      const pools = prizePoolsForSubscribers(subscribers, rolloverAmount);

      update.jackpot_amount = pools.jackpot;
      update.pool_4match = pools.pool4match;
      update.pool_3match = pools.pool3match;
      update.rollover_amount = rolloverAmount;
      update.status = 'draft';
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ draw });
    }

    const { data: updated, error: updateError } = await admin
      .from('draws')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ draw: updated });
  } catch (error) {
    console.error('[draws PATCH]', error);
    return NextResponse.json({ error: 'Failed to update draw' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const admin = createAdminClient();
    const { data: draw, error: fetchError } = await admin
      .from('draws')
      .select('id, status')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !draw) {
      return NextResponse.json({ error: 'Draw not found' }, { status: 404 });
    }

    if (draw.status === 'published') {
      return NextResponse.json(
        { error: 'Published draws cannot be deleted' },
        { status: 409 }
      );
    }

    const { error: deleteError } = await admin.from('draws').delete().eq('id', id);
    if (deleteError) throw new Error(deleteError.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[draws DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete draw' }, { status: 500 });
  }
}
