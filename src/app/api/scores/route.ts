// TEST PLAN:
// 1. Add 5 scores with different dates → all stored
// 2. Add 6th score → oldest removed, 5 remain
// 3. Add score with duplicate date → 409 error
// 4. Edit score → updates correctly, date conflict caught
// 5. Delete score → removed, count decrements
// 6. Add score with out-of-range value (0 or 46) → validation error

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  ScoreDeleteSchema,
  ScoreSchema,
  ScoreUpdateSchema,
} from '@/lib/validations';
import type { GolfScore } from '@/types';

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, userId: null as string | null };
  }

  return { supabase, userId: user.id };
}

async function fetchUserScores(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<GolfScore[]> {
  const { data, error } = await supabase
    .from('golf_scores')
    .select('*')
    .eq('user_id', userId)
    .order('score_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as GolfScore[];
}

export async function GET() {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const scores = await fetchUserScores(supabase, userId);
    return NextResponse.json({ scores });
  } catch (error) {
    console.error('[scores GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch scores' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ScoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { score, score_date } = parsed.data;

  try {
    const existing = await fetchUserScores(supabase, userId);

    const duplicate = existing.find((entry) => entry.score_date === score_date);
    if (duplicate) {
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
        const { error: deleteError } = await supabase
          .from('golf_scores')
          .delete()
          .eq('id', oldest.id)
          .eq('user_id', userId);

        if (deleteError) {
          throw new Error(deleteError.message);
        }
      }
    }

    const { error: insertError } = await supabase.from('golf_scores').insert({
      user_id: userId,
      score,
      score_date,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'A score for this date already exists' },
          { status: 409 }
        );
      }
      throw new Error(insertError.message);
    }

    const scores = await fetchUserScores(supabase, userId);
    return NextResponse.json({ scores }, { status: 201 });
  } catch (error) {
    console.error('[scores POST]', error);
    return NextResponse.json(
      { error: 'Failed to add score' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ScoreUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id, score, score_date } = parsed.data;

  try {
    const existing = await fetchUserScores(supabase, userId);
    const current = existing.find((entry) => entry.id === id);

    if (!current) {
      return NextResponse.json({ error: 'Score not found' }, { status: 404 });
    }

    const dateConflict = existing.find(
      (entry) => entry.score_date === score_date && entry.id !== id
    );

    if (dateConflict) {
      return NextResponse.json(
        { error: 'A score for this date already exists' },
        { status: 409 }
      );
    }

    const { error: updateError } = await supabase
      .from('golf_scores')
      .update({ score, score_date })
      .eq('id', id)
      .eq('user_id', userId);

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json(
          { error: 'A score for this date already exists' },
          { status: 409 }
        );
      }
      throw new Error(updateError.message);
    }

    const scores = await fetchUserScores(supabase, userId);
    return NextResponse.json({ scores });
  } catch (error) {
    console.error('[scores PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update score' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ScoreDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id } = parsed.data;

  try {
    const { data, error: deleteError } = await supabase
      .from('golf_scores')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id');

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (!data?.length) {
      return NextResponse.json({ error: 'Score not found' }, { status: 404 });
    }

    const scores = await fetchUserScores(supabase, userId);
    return NextResponse.json({ scores });
  } catch (error) {
    console.error('[scores DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete score' },
      { status: 500 }
    );
  }
}
