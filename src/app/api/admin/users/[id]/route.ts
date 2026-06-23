import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/draw/processing';
import { AdminUpdateUserSchema } from '@/lib/validations';
import type { GolfScore, Profile } from '@/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: scores } = await admin
      .from('golf_scores')
      .select('*')
      .eq('user_id', id)
      .order('score_date', { ascending: false });

    let charity = null;
    if (profile.charity_id) {
      const { data } = await admin
        .from('charities')
        .select('*')
        .eq('id', profile.charity_id)
        .maybeSingle();
      charity = data;
    }

    return NextResponse.json({
      profile: profile as Profile,
      scores: (scores ?? []) as GolfScore[],
      charity,
    });
  } catch (error) {
    console.error('[admin user GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
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

  const parsed = AdminUpdateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('profiles')
      .update(parsed.data)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ profile: data as Profile });
  } catch (error) {
    console.error('[admin user PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
