import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/draw/processing';
import { VerifyWinnerSchema } from '@/lib/validations';
import { notifyWinnerVerificationEmail } from '@/lib/email/notifications';
import { createSignedProofUrl, unwrapJoin } from '@/lib/winners/helpers';

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

  const parsed = VerifyWinnerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { draw_entry_id, action, notes } = parsed.data;

  try {
    const admin = createAdminClient();
    const { data: entry, error: fetchError } = await admin
      .from('draw_entries')
      .select('*, profiles:user_id (full_name, email), draws:draw_id (month)')
      .eq('id', draw_entry_id)
      .maybeSingle();

    if (fetchError || !entry) {
      return NextResponse.json({ error: 'Draw entry not found' }, { status: 404 });
    }

    if (!entry.match_type || Number(entry.prize_amount) <= 0) {
      return NextResponse.json(
        { error: 'Entry is not a winning draw entry' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const updates =
      action === 'approve'
        ? { payment_status: 'paid' as const, verified_at: now }
        : { payment_status: 'rejected' as const, proof_url: null, verified_at: null };

    const { data: updated, error: updateError } = await admin
      .from('draw_entries')
      .update(updates)
      .eq('id', draw_entry_id)
      .select('*')
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    const profile = unwrapJoin(
      entry.profiles as
        | { full_name: string; email: string }
        | { full_name: string; email: string }[]
        | null
    );

    if (profile?.email) {
      notifyWinnerVerificationEmail({
        email: profile.email,
        name: profile.full_name,
        status: action === 'approve' ? 'approved' : 'rejected',
        prize: Number(entry.prize_amount),
        notes: notes ?? undefined,
      });
    }

    const proof_signed_url = await createSignedProofUrl(admin, updated.proof_url);

    return NextResponse.json({
      draw_entry: {
        ...updated,
        proof_signed_url,
      },
    });
  } catch (error) {
    console.error('[winners verify POST]', error);
    return NextResponse.json(
      { error: 'Failed to verify winner' },
      { status: 500 }
    );
  }
}
