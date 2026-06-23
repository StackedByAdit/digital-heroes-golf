import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { attachEventsToCharities } from '@/lib/charity/server';
import { requireAdmin } from '@/lib/draw/processing';
import { CreateCharitySchema } from '@/lib/validations';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get('featured') === 'true';
  const search = searchParams.get('search')?.trim().toLowerCase();
  const includeInactive = searchParams.get('include_inactive') === 'true';

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    isAdmin = profile?.role === 'admin';
  }

  try {
    const admin = createAdminClient();
    let query = admin.from('charities').select('*').order('name');

    if (!(isAdmin && includeInactive)) {
      query = query.eq('is_active', true);
    }

    if (featured) {
      query = query.eq('is_featured', true);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let charities = data ?? [];

    if (search) {
      charities = charities.filter(
        (charity) =>
          charity.name.toLowerCase().includes(search) ||
          (charity.description ?? '').toLowerCase().includes(search)
      );
    }

    const withEvents = await attachEventsToCharities(admin, charities, true);

    return NextResponse.json({ charities: withEvents });
  } catch (error) {
    console.error('[charities GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch charities' },
      { status: 500 }
    );
  }
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

  const parsed = CreateCharitySchema.safeParse(body);
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
      .insert({
        ...parsed.data,
        is_featured: parsed.data.is_featured ?? false,
        is_active: true,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    const [charity] = await attachEventsToCharities(admin, [data], true);
    return NextResponse.json({ charity }, { status: 201 });
  } catch (error) {
    console.error('[charities POST]', error);
    return NextResponse.json(
      { error: 'Failed to create charity' },
      { status: 500 }
    );
  }
}
