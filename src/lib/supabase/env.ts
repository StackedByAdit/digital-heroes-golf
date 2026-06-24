/**
 * Resolves the Supabase public (low-privilege) API key.
 * Supports legacy JWT anon keys and newer sb_publishable_* keys.
 */
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }
  return url;
}

function isValidPublicSupabaseKey(key: string): boolean {
  if (!key || key.startsWith('http://') || key.startsWith('https://')) {
    return false;
  }
  return key.startsWith('eyJ') || key.startsWith('sb_publishable_');
}

export function getSupabaseAnonKey(): string {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (anon && isValidPublicSupabaseKey(anon)) return anon;
  if (publishable && isValidPublicSupabaseKey(publishable)) return publishable;

  throw new Error(
    'Invalid Supabase API key. Set NEXT_PUBLIC_SUPABASE_ANON_KEY to your anon JWT or publishable key (sb_publishable_...) from the Supabase dashboard — not the project URL.',
  );
}

export function getSupabaseServiceRoleKey(): string {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();

  if (serviceRole) return serviceRole;
  if (secret?.startsWith('sb_secret_')) return secret;

  throw new Error(
    'Missing SUPABASE_SERVICE_ROLE_KEY (legacy JWT) or SUPABASE_SECRET_KEY (sb_secret_...).',
  );
}
