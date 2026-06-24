/** Maps raw Supabase Auth errors to clearer user-facing copy. */
export function mapSupabaseAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('rate limit') || normalized.includes('too many requests')) {
    return 'Too many signup or email attempts. Wait about an hour, or sign in if you already created an account. For local development, add SUPABASE_SERVICE_ROLE_KEY to .env.local so signup does not send confirmation emails.';
  }

  if (
    normalized.includes('already registered') ||
    normalized.includes('already been registered') ||
    normalized.includes('user already exists')
  ) {
    return 'An account with this email already exists. Sign in or reset your password.';
  }

  if (normalized.includes('invalid api key')) {
    return 'Authentication is misconfigured. Check NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.';
  }

  if (normalized.includes('password')) {
    return message;
  }

  return message;
}
