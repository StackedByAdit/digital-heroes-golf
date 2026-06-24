/**
 * Admin dashboard API integration tests.
 * Requires: dev server on BASE_URL (default http://localhost:3000)
 * Run: npm run dev (separate terminal) then npm run test:admin
 */
import { createServerClient } from '@supabase/ssr';
import { loadEnvLocal } from './load-env-local';

loadEnvLocal();

const BASE_URL_CANDIDATES = [
  process.env.TEST_BASE_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean) as string[];
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'admin@digitalheroes.golf';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'ChangeMe123!';

type CookieEntry = { name: string; value: string };

const cookies: CookieEntry[] = [];

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  return url;
}

function getAnonKey() {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  return key;
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function signInAdmin() {
  const supabase = createServerClient(getSupabaseUrl(), getAnonKey(), {
    cookies: {
      getAll() {
        return cookies;
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          const index = cookies.findIndex((entry) => entry.name === name);
          if (index >= 0) cookies[index].value = value;
          else cookies.push({ name, value });
        }
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (error) {
    throw new Error(`Admin sign-in failed: ${error.message}`);
  }
}

function cookieHeader() {
  return cookies.map((entry) => `${entry.name}=${entry.value}`).join('; ');
}

async function api(
  path: string,
  init: RequestInit = {},
  baseUrl: string
): Promise<{ status: number; data: Record<string, unknown> }> {
  const headers = new Headers(init.headers);
  if (cookies.length > 0) {
    headers.set('Cookie', cookieHeader());
  }
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  let data: Record<string, unknown> = {};
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    data = {};
  }

  return { status: response.status, data };
}

async function ensureServerRunning(): Promise<string> {
  for (const baseUrl of BASE_URL_CANDIDATES) {
    try {
      const response = await fetch(baseUrl, { method: 'HEAD' });
      if (response.ok || response.status === 404) {
        return baseUrl;
      }
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    `Dev server not reachable. Start it with: npm run dev (tried ${BASE_URL_CANDIDATES.join(', ')})`
  );
}

async function main() {
  console.log('Admin API integration tests');

  const baseUrl = await ensureServerRunning();
  console.log(`Base URL: ${baseUrl}`);

  await signInAdmin();
  console.log(`Signed in as ${ADMIN_EMAIL}`);

  // --- Reports & analytics ---
  {
    const { status, data } = await api('/api/admin/stats', {}, baseUrl);
    assert(status === 200, `GET /api/admin/stats expected 200, got ${status}`);
    assert(typeof data.total_users === 'number', 'stats.total_users missing');
    assert(
      typeof data.total_prize_pool_this_month === 'number',
      'stats.total_prize_pool_this_month missing'
    );
    assert(
      typeof data.total_charity_contributions === 'number',
      'stats.total_charity_contributions missing'
    );
    console.log('✓ Reports & analytics (/api/admin/stats)');
  }

  // --- User management ---
  let subscriberId: string | undefined;
  {
    const { status, data } = await api('/api/admin/users?page=1');
    assert(status === 200, `GET /api/admin/users expected 200, got ${status}`);
    const users = data.users as Array<{ id: string; email: string }> | undefined;
    assert(Array.isArray(users), 'users array missing');
    assert(users!.length > 0, 'expected at least one user');
    subscriberId = users!.find((u) => u.email.includes('subscriber'))?.id;
    console.log('✓ User management list (/api/admin/users)');
  }

  {
    const { status, data } = await api('/api/admin/users?search=admin');
    assert(status === 200, `user search failed: ${status}`);
    const users = data.users as Array<{ email: string }> | undefined;
    assert(
      Boolean(users?.some((u) => u.email === ADMIN_EMAIL)),
      'admin user not found in search'
    );
    console.log('✓ User search');
  }

  if (subscriberId) {
    const { status, data } = await api(`/api/admin/users/${subscriberId}`);
    assert(status === 200, `GET user detail failed: ${status}`);
    assert(data.profile !== undefined, 'profile missing in user detail');
    console.log('✓ View user profile');
  }

  // --- Draw management ---
  const testMonth = `2099-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  let drawId: string | undefined;

  {
    const { status, data } = await api('/api/draws', {
      method: 'POST',
      body: JSON.stringify({ month: testMonth, draw_type: 'random' }),
    });
    assert(status === 201 || status === 200, `create draw failed: ${status} ${JSON.stringify(data)}`);
    const draw = data.draw as { id: string } | undefined;
    assert(draw?.id, 'draw id missing after create');
    drawId = draw!.id;
    console.log('✓ Create draw');
  }

  {
    const { status } = await api(`/api/draws/${drawId}/simulate`, { method: 'POST' });
    assert(status === 200, `simulate draw failed: ${status}`);
    console.log('✓ Simulate draw');
  }

  {
    const { status, data } = await api(`/api/draws/${drawId}`, {
      method: 'PATCH',
      body: JSON.stringify({ draw_type: 'algorithmic', regenerate_numbers: true }),
    });
    assert(status === 200, `toggle draw type failed: ${status}`);
    const draw = data.draw as { draw_type: string } | undefined;
    assert(draw?.draw_type === 'algorithmic', 'draw type not updated');
    console.log('✓ Configure draw logic (random vs algorithmic)');
  }

  {
    const { status } = await api(`/api/draws/${drawId}`, {
      method: 'PATCH',
      body: JSON.stringify({ regenerate_numbers: true }),
    });
    assert(status === 200, `regenerate numbers failed: ${status}`);
    console.log('✓ Regenerate draw numbers');
  }

  {
    const { status, data } = await api('/api/draws');
    assert(status === 200, `list draws failed: ${status}`);
    const draws = data.draws as Array<{ id: string }> | undefined;
    assert(draws?.some((d) => d.id === drawId), 'created draw not in list');
    console.log('✓ List draws');
  }

  {
    const { status } = await api(`/api/draws/${drawId}`, { method: 'DELETE' });
    assert(status === 200, `delete draw failed: ${status}`);
    console.log('✓ Delete draft draw');
  }

  // --- Charity management ---
  let charityId: string | undefined;
  {
    const { status, data } = await api('/api/charities?include_inactive=true');
    assert(status === 200, `list charities failed: ${status}`);
    const charities = data.charities as Array<{ id: string }> | undefined;
    assert(Array.isArray(charities) && charities.length > 0, 'no charities');
    charityId = charities![0].id;
    console.log('✓ List charities');
  }

  {
    const { status, data } = await api('/api/charities', {
      method: 'POST',
      body: JSON.stringify({
        name: `QA Test Charity ${Date.now()}`,
        description: 'Automated admin test charity',
        is_featured: false,
      }),
    });
    assert(status === 201 || status === 200, `create charity failed: ${status}`);
    const charity = data.charity as { id: string } | undefined;
    assert(charity?.id, 'charity id missing');
    charityId = charity!.id;
    console.log('✓ Add charity');
  }

  {
    const { status } = await api(`/api/charities/${charityId}`, {
      method: 'PUT',
      body: JSON.stringify({ description: 'Updated by admin test' }),
    });
    assert(status === 200, `update charity failed: ${status}`);
    console.log('✓ Edit charity');
  }

  let eventId: string | undefined;
  {
    const { status, data } = await api(`/api/charities/${charityId}/events`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'QA Golf Day',
        event_date: '2099-12-01',
        description: 'Test event',
      }),
    });
    assert(status === 201 || status === 200, `create event failed: ${status}`);
    eventId = (data.event as { id: string }).id;
    console.log('✓ Add charity event');
  }

  {
    const { status } = await api(`/api/charities/${charityId}/events`, {
      method: 'PUT',
      body: JSON.stringify({
        id: eventId,
        title: 'QA Golf Day Updated',
        event_date: '2099-12-02',
        description: 'Updated event',
      }),
    });
    assert(status === 200, `update event failed: ${status}`);
    console.log('✓ Edit charity event');
  }

  {
    const { status } = await api(`/api/charities/${charityId}/events`, {
      method: 'DELETE',
      body: JSON.stringify({ id: eventId }),
    });
    assert(status === 200, `delete event failed: ${status}`);
    console.log('✓ Delete charity event');
  }

  {
    const { status } = await api(`/api/charities/${charityId}`, { method: 'DELETE' });
    assert(status === 200, `deactivate charity failed: ${status}`);
    console.log('✓ Deactivate charity');
  }

  // --- Winners management ---
  {
    const { status, data } = await api('/api/winners');
    assert(status === 200, `list winners failed: ${status}`);
    assert(Array.isArray(data.winners), 'winners array missing');
    console.log('✓ Winners list (/api/winners)');
  }

  console.log('\nAll admin API integration tests passed.');
}

main().catch((error) => {
  console.error('\nAdmin API tests failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
