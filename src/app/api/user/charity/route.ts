import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/draw/processing';
import { UpdateUserCharitySchema } from '@/lib/validations';

export async function PUT(request: Request) {
  const auth = await requireAuth();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = UpdateUserCharitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { charity_id, charity_percentage } = parsed.data;

  try {
    const { data: charity, error: charityError } = await auth.supabase
      .from('charities')
      .select('id, is_active')
      .eq('id', charity_id)
      .maybeSingle();

    if (charityError || !charity?.is_active) {
      return NextResponse.json(
        { error: 'Charity not found or inactive' },
        { status: 404 }
      );
    }

    const { data: profile, error: updateError } = await auth.supabase
      .from('profiles')
      .update({ charity_id, charity_percentage })
      .eq('id', auth.user.id)
      .select('*')
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('[user charity PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update charity preference' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const auth = await requireAuth();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data: profile, error } = await auth.supabase
    .from('profiles')
    .select('*')
    .eq('id', auth.user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  let charity = null;
  if (profile.charity_id) {
    const { data } = await auth.supabase
      .from('charities')
      .select('*')
      .eq('id', profile.charity_id)
      .maybeSingle();
    charity = data;
  }

  return NextResponse.json({ profile, charity });
}
