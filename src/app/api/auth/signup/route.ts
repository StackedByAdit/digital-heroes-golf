import { NextResponse } from 'next/server';
import { z } from 'zod';
import { mapSupabaseAuthError } from '@/lib/auth/errors';
import { isPermanentAdminEmail } from '@/lib/auth/permanent-admins';
import { createAdminClient } from '@/lib/supabase/server';

const SignupStep1Schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  full_name: z.string().min(2).max(100),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = SignupStep1Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, password, full_name } = parsed.data;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      {
        error:
          'Server signup is not configured. Add SUPABASE_SERVICE_ROLE_KEY from the Supabase dashboard to .env.local.',
        fallback: true,
      },
      { status: 503 }
    );
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (error) {
    return NextResponse.json(
      { error: mapSupabaseAuthError(error.message) },
      { status: 400 }
    );
  }

  if (!data.user) {
    return NextResponse.json(
      { error: 'Account could not be created. Please try again.' },
      { status: 500 }
    );
  }

  const profileUpdate: {
    full_name: string;
    role?: 'admin';
    subscription_status?: 'active';
  } = { full_name };

  if (isPermanentAdminEmail(email)) {
    profileUpdate.role = 'admin';
    profileUpdate.subscription_status = 'active';
  }

  await admin.from('profiles').update(profileUpdate).eq('id', data.user.id);

  return NextResponse.json({ userId: data.user.id });
}
