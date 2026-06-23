import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/draw/processing';
import {
  AdminScoreDeleteSchema,
  AdminScoreSchema,
  AdminScoreUpdateSchema,
} from '@/lib/validations';
import type { GolfScore } from '@/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function fetchUserScores(userId: string): Promise<GolfScore[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('golf_scores')
    .select('*')
    .eq('user_id', userId)
    .order('score_date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as GolfScore[];
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: userId } = await context.params;

  try {
    const scores = await fetchUserScores(userId);
    return NextResponse.json({ scores });
  } catch (error) {
    console.error('[admin user scores GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch scores' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: userId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = AdminScoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { score, score_date } = parsed.data;
  const admin = createAdminClient();

  try {
    const existing = await fetchUserScores(userId);

    if (existing.some((entry) => entry.score_date === score_date)) {
      return NextResponse.json(
        { error: 'A score for this date already exists' },
        { status: 409 }
      );
    }

    if (existing.length >= 5) {
      const oldest = [...existing].sort(
        (a, b) =>
          new Date(a.score_date).getTime() - new Date(b.score_date).getTime()
      )[0];

      if (oldest) {
        await admin.from('golf_scores').delete().eq('id', oldest.id);
      }
    }

    const { error: insertError } = await admin.from('golf_scores').insert({
      user_id: userId,
      score,
      score_date,
    });

    if (insertError) throw new Error(insertError.message);

    const scores = await fetchUserScores(userId);
    return NextResponse.json({ scores }, { status: 201 });
  } catch (error) {
    console.error('[admin user scores POST]', error);
    return NextResponse.json(
      { error: 'Failed to add score' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: userId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = AdminScoreUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id, score, score_date } = parsed.data;
  const admin = createAdminClient();

  try {
    const existing = await fetchUserScores(userId);
    const current = existing.find((entry) => entry.id === id);

    if (!current) {
      return NextResponse.json({ error: 'Score not found' }, { status: 404 });
    }

    if (
      existing.some(
        (entry) => entry.score_date === score_date && entry.id !== id
      )
    ) {
      return NextResponse.json(
        { error: 'A score for this date already exists' },
        { status: 409 }
      );
    }

    const { error: updateError } = await admin
      .from('golf_scores')
      .update({ score, score_date })
      .eq('id', id)
      .eq('user_id', userId);

    if (updateError) throw new Error(updateError.message);

    const scores = await fetchUserScores(userId);
    return NextResponse.json({ scores });
  } catch (error) {
    console.error('[admin user scores PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update score' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: userId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = AdminScoreDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  try {
    const { data, error } = await admin
      .from('golf_scores')
      .delete()
      .eq('id', parsed.data.id)
      .eq('user_id', userId)
      .select('id');

    if (error) throw new Error(error.message);
    if (!data?.length) {
      return NextResponse.json({ error: 'Score not found' }, { status: 404 });
    }

    const scores = await fetchUserScores(userId);
    return NextResponse.json({ scores });
  } catch (error) {
    console.error('[admin user scores DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete score' },
      { status: 500 }
    );
  }
}
