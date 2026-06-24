import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/draw/processing';
import {
  createSignedProofUrl,
  getWinnerDisplayStatus,
  unwrapJoin,
  type WinnerListRow,
} from '@/lib/winners/helpers';
import type { PaymentStatus } from '@/types';

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const drawId = searchParams.get('draw_id');

  try {
    const admin = createAdminClient();
    let query = admin
      .from('draw_entries')
      .select(
        `
        id,
        draw_id,
        user_id,
        match_type,
        prize_amount,
        payment_status,
        proof_url,
        verified_at,
        created_at,
        profiles:user_id (full_name, email),
        draws:draw_id (month)
      `
      )
      .not('match_type', 'is', null)
      .gt('prize_amount', 0)
      .order('created_at', { ascending: false });

    if (drawId) {
      query = query.eq('draw_id', drawId);
    }

    if (
      statusFilter === 'pending' ||
      statusFilter === 'paid' ||
      statusFilter === 'rejected'
    ) {
      query = query.eq('payment_status', statusFilter as PaymentStatus);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let rows: WinnerListRow[] = await Promise.all(
      (data ?? []).map(async (row) => {
        const profile = unwrapJoin(row.profiles as { full_name: string; email: string } | { full_name: string; email: string }[] | null);
        const draw = unwrapJoin(row.draws as { month: string } | { month: string }[] | null);
        const proof_signed_url = await createSignedProofUrl(
          admin,
          row.proof_url as string | null
        );

        return {
          id: row.id,
          draw_id: row.draw_id,
          user_id: row.user_id,
          match_type: row.match_type,
          prize_amount: Number(row.prize_amount),
          payment_status: row.payment_status,
          proof_url: row.proof_url,
          proof_signed_url,
          verified_at: row.verified_at,
          created_at: row.created_at,
          winner_name: profile?.full_name ?? 'Unknown',
          winner_email: profile?.email ?? '',
          draw_month: draw?.month ?? '',
        };
      })
    );

    if (statusFilter === 'under_review') {
      rows = rows.filter(
        (row) =>
          getWinnerDisplayStatus(row) === 'under_review'
      );
    }

    return NextResponse.json({ winners: rows });
  } catch (error) {
    console.error('[winners GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch winners' },
      { status: 500 }
    );
  }
}
