import { loadEnvLocal } from './load-env-local';
import { createClient } from '@supabase/supabase-js';

loadEnvLocal();

type TestUser = {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'subscriber';
  subscription_status: 'active' | 'inactive';
  subscription_plan: 'monthly' | 'yearly' | null;
  charity_id: string;
  charity_percentage: number;
};

const TEST_USERS: TestUser[] = [
  {
    email: 'admin@digitalheroes.golf',
    password: 'ChangeMe123!',
    full_name: 'Admin User',
    role: 'admin',
    subscription_status: 'active',
    subscription_plan: 'yearly',
    charity_id: 'a0000001-0000-4000-8000-000000000001',
    charity_percentage: 25,
  },
  {
    email: 'subscriber@digitalheroes.golf',
    password: 'ChangeMe123!',
    full_name: 'Subscribed User',
    role: 'subscriber',
    subscription_status: 'active',
    subscription_plan: 'monthly',
    charity_id: 'a0000002-0000-4000-8000-000000000002',
    charity_percentage: 25,
  },
  {
    email: 'admin@digitalheroes.co.in',
    password: 'Admin2025!',
    full_name: 'Recruiter Admin',
    role: 'admin',
    subscription_status: 'active',
    subscription_plan: 'yearly',
    charity_id: 'a0000001-0000-4000-8000-000000000001',
    charity_percentage: 25,
  },
  {
    email: 'testuser@digitalheroes.co.in',
    password: 'TestUser2025!',
    full_name: 'Recruiter Test User',
    role: 'subscriber',
    subscription_status: 'active',
    subscription_plan: 'monthly',
    charity_id: 'a0000002-0000-4000-8000-000000000002',
    charity_percentage: 25,
  },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !secret) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  }

  const admin = createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const user of TEST_USERS) {
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    let userId = profile?.id;

    if (!userId) {
      const { data, error } = await admin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: user.full_name },
      });

      if (error || !data.user) {
        throw new Error(`Failed to create ${user.email}: ${error?.message}`);
      }

      userId = data.user.id;
      console.log(`Created auth user: ${user.email}`);
    } else {
      await admin.auth.admin.updateUserById(userId, {
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: user.full_name },
      });
      console.log(`Updated auth user: ${user.email}`);
    }

    const { error: profileError } = await admin
      .from('profiles')
      .update({
        full_name: user.full_name,
        role: user.role,
        subscription_status: user.subscription_status,
        subscription_plan: user.subscription_plan,
        charity_id: user.charity_id,
        charity_percentage: user.charity_percentage,
      })
      .eq('id', userId);

    if (profileError) {
      throw new Error(`Failed to update profile for ${user.email}: ${profileError.message}`);
    }

    console.log(
      `Ready: ${user.email} (${user.role}, subscription=${user.subscription_status})`,
    );
  }

  console.log('\nTest credentials:');
  for (const user of TEST_USERS) {
    console.log(`${user.email} / ${user.password}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
