import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/draw/processing';
import type { Profile } from '@/types';

export type AdminUserRow = Profile & {
  charity_name: string | null;
  score_count: number;
};

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim().toLowerCase() ?? '';
  const status = searchParams.get('status');
  const plan = searchParams.get('plan');
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const pageSize = 25;

  try {
    const admin = createAdminClient();
    let query = admin
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('subscription_status', status);
    }

    if (plan) {
      query = query.eq('subscription_plan', plan);
    }

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data: profiles, error, count } = await query;

    if (error) throw new Error(error.message);

    const pageRows = (profiles ?? []) as Profile[];
    const total = count ?? pageRows.length;

    const { data: charities } = await admin.from('charities').select('id, name');
    const charityNames = new Map(
      (charities ?? []).map((charity) => [charity.id, charity.name as string])
    );

    const users: AdminUserRow[] = await Promise.all(
      pageRows.map(async (profile) => {
        const { count: scoreCount } = await admin
          .from('golf_scores')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id);

        return {
          ...profile,
          charity_name: profile.charity_id
            ? charityNames.get(profile.charity_id) ?? null
            : null,
          score_count: scoreCount ?? 0,
        };
      })
    );

    return NextResponse.json({
      users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('[admin users GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
