import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/draw/processing';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from('profiles')
      .select('email')
      .eq('id', id)
      .maybeSingle();

    if (error || !profile?.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { error: resetError } = await admin.auth.resetPasswordForEmail(
      profile.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/login`,
      }
    );

    if (resetError) {
      throw new Error(resetError.message);
    }

    return NextResponse.json({
      success: true,
      message: `Password reset email sent to ${profile.email}`,
    });
  } catch (error) {
    console.error('[admin reset-password POST]', error);
    return NextResponse.json(
      { error: 'Failed to send password reset email' },
      { status: 500 }
    );
  }
}
