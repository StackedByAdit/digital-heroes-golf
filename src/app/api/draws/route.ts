import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { calculatePrizePools } from '@/lib/drawEngine';
import {
  DEFAULT_MONTHLY_FEE,
  fetchActiveSubscribersWithScores,
  flattenScorePool,
  generateDrawNumbers,
  requireAdmin,
  requireAuth,
  resolveRolloverForMonth,
  countDrawWinners,
  type DrawWithMeta,
} from '@/lib/draw/processing';
import { CreateDrawSchema } from '@/lib/validations';
import type { Draw } from '@/types';

export async function GET() {
  const auth = await requireAuth();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  let query = admin.from('draws').select('*').order('month', { ascending: false });

  if (!auth.isAdmin) {
    query = query.eq('status', 'published');
  }

  const { data: draws, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch draws' }, { status: 500 });
  }

  const enriched: DrawWithMeta[] = [];

  for (const draw of (draws ?? []) as Draw[]) {
    const item: DrawWithMeta = { ...draw };

    if (auth.isAdmin) {
      item.winner_counts = await countDrawWinners(draw.id);
    }

    if (!auth.isAdmin) {
      const { data: entry } = await auth.supabase
        .from('draw_entries')
        .select('*')
        .eq('draw_id', draw.id)
        .eq('user_id', auth.user.id)
        .maybeSingle();

      item.my_entry = entry;
    }

    enriched.push(item);
  }

  return NextResponse.json({ draws: enriched });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = CreateDrawSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { month, draw_type } = parsed.data;

  try {
    const admin = createAdminClient();

    const { data: existing } = await admin
      .from('draws')
      .select('id')
      .eq('month', month)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'A draw already exists for this month' },
        { status: 409 }
      );
    }

    const subscribers = await fetchActiveSubscribersWithScores();
    const scorePool = flattenScorePool(subscribers);
    const drawnNumbers = generateDrawNumbers(draw_type, scorePool);
    const rolloverAmount = await resolveRolloverForMonth(month);

    const pools = calculatePrizePools({
      subscriberCount: subscribers.length,
      monthlyFeePerUser: DEFAULT_MONTHLY_FEE,
      rolloverAmount,
    });

    const { data: draw, error: insertError } = await admin
      .from('draws')
      .insert({
        month,
        draw_type,
        drawn_numbers: drawnNumbers,
        status: 'draft',
        jackpot_amount: pools.jackpot,
        pool_4match: pools.pool4match,
        pool_3match: pools.pool3match,
        rollover_amount: rolloverAmount,
      })
      .select('*')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'A draw already exists for this month' },
          { status: 409 }
        );
      }
      throw new Error(insertError.message);
    }

    return NextResponse.json({ draw }, { status: 201 });
  } catch (error) {
    console.error('[draws POST]', error);
    return NextResponse.json({ error: 'Failed to create draw' }, { status: 500 });
  }
}
