import { loadEnvLocal } from './load-env-local';
import { createClient } from '@supabase/supabase-js';
import {
  dashboardAccessFromNavProfile,
  isAdminProfile,
  NAV_PROFILE_SELECT,
  type NavProfileRow,
} from '../src/lib/auth/nav-profile';
import { resolvePostLoginRedirect } from '../src/lib/auth/post-login';

loadEnvLocal();

const TEST_ACCOUNTS = [
  {
    email: 'admin@digitalheroes.golf',
    password: 'ChangeMe123!',
    expectDashboardAccess: true,
    expectAdmin: true,
  },
  {
    email: 'subscriber@digitalheroes.golf',
    password: 'ChangeMe123!',
    expectDashboardAccess: true,
    expectAdmin: false,
  },
  {
    email: 'admin@digitalheroes.co.in',
    password: 'Admin2025!',
    expectDashboardAccess: true,
    expectAdmin: true,
  },
  {
    email: 'testuser@digitalheroes.co.in',
    password: 'TestUser2025!',
    expectDashboardAccess: true,
    expectAdmin: false,
  },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !anon) {
    throw new Error('Missing Supabase env vars in .env.local');
  }

  for (const account of TEST_ACCOUNTS) {
    const client = createClient(url, anon, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await client.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });

    if (error || !data.user) {
      throw new Error(`Login failed for ${account.email}: ${error?.message ?? 'no user'}`);
    }

    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select(NAV_PROFILE_SELECT)
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error(`Nav profile fetch failed for ${account.email}: ${profileError?.message}`);
    }

    const navProfile = profile as NavProfileRow;
    const dashboardAccess =
      dashboardAccessFromNavProfile(navProfile) || isAdminProfile(navProfile);
    const redirect = resolvePostLoginRedirect(null, {
      ...navProfile,
      subscription_ends_at: null,
    });

    if (dashboardAccess !== account.expectDashboardAccess) {
      throw new Error(
        `${account.email}: expected dashboardAccess=${account.expectDashboardAccess}, got ${dashboardAccess} (status=${navProfile.subscription_status}, role=${navProfile.role})`,
      );
    }

    if (isAdminProfile(navProfile) !== account.expectAdmin) {
      throw new Error(
        `${account.email}: expected admin=${account.expectAdmin}, got role=${navProfile.role}`,
      );
    }

    if (redirect !== '/') {
      throw new Error(`${account.email}: expected post-login redirect '/', got '${redirect}'`);
    }

    console.log(
      `✓ ${account.email} — role=${navProfile.role}, subscription=${navProfile.subscription_status}, navDashboard=${dashboardAccess}`,
    );

    await client.auth.signOut();
  }

  console.log('\nAll test accounts verified (nav profile fetch).');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
