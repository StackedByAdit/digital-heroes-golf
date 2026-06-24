import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { attachEventsToCharities, fetchEventsForCharity } from '@/lib/charity/server';
import { requireAdmin } from '@/lib/draw/processing';
import { UpdateCharitySchema } from '@/lib/validations';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('charities')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data || !data.is_active) {
      return NextResponse.json({ error: 'Charity not found' }, { status: 404 });
    }

    const events = await fetchEventsForCharity(admin, id, false);
    const charity = { ...data, upcoming_events: events };

    return NextResponse.json({ charity });
  } catch (error) {
    console.error('[charity GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch charity' },
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

  const parsed = UpdateCharitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('charities')
      .update(parsed.data)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    const [charity] = await attachEventsToCharities(admin, [data], false);
    return NextResponse.json({ charity });
  } catch (error) {
    console.error('[charity PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update charity' },
      { status: 500 }
    );
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
    const { data, error } = await admin
      .from('charities')
      .update({ is_active: false, is_featured: false })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    const [charity] = await attachEventsToCharities(admin, [data], false);
    return NextResponse.json({ charity });
  } catch (error) {
    console.error('[charity DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to deactivate charity' },
      { status: 500 }
    );
  }
}
