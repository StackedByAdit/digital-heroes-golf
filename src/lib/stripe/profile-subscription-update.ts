import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/server';
import { hasPlatformAccess } from '@/lib/subscription/access';
import type { SubscriptionPlan, SubscriptionStatus } from '@/types';

export type ProfileSubscriptionFields = {
  subscription_status: SubscriptionStatus;
  subscription_plan?: SubscriptionPlan | null;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
  subscription_ends_at?: string | null;
  charity_id?: string | null;
  charity_percentage?: number;
};

function isMissingColumnError(
  error: { code?: string; message?: string },
  column: string,
): boolean {
  const message = error.message?.toLowerCase() ?? '';
  return (
    error.code === 'PGRST204' ||
    message.includes(column.toLowerCase()) ||
    message.includes('schema cache')
  );
}

export function normalizeCharityId(
  value: string | null | undefined,
): string | null {
  if (!value || !value.trim()) return null;
  return value.trim();
}

export function normalizeCharityPercentage(
  value: string | number | null | undefined,
): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(parsed) || parsed < 10 || parsed > 100) return undefined;
  return parsed;
}

function buildUpdatePayload(
  fields: ProfileSubscriptionFields,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    subscription_status: fields.subscription_status,
  };

  if (fields.subscription_plan !== undefined) {
    payload.subscription_plan = fields.subscription_plan;
  }
  if (fields.stripe_subscription_id !== undefined) {
    payload.stripe_subscription_id = fields.stripe_subscription_id;
  }
  if (fields.stripe_customer_id !== undefined) {
    payload.stripe_customer_id = fields.stripe_customer_id;
  }
  if (fields.subscription_ends_at !== undefined) {
    payload.subscription_ends_at = fields.subscription_ends_at;
  }
  if (fields.charity_id !== undefined) {
    payload.charity_id = normalizeCharityId(fields.charity_id);
  }
  if (fields.charity_percentage !== undefined) {
    payload.charity_percentage = fields.charity_percentage;
  }

  return payload;
}

export async function updateProfileSubscriptionFields(
  admin: SupabaseClient,
  userId: string,
  fields: ProfileSubscriptionFields,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const payload = buildUpdatePayload(fields);

  let { error } = await admin.from('profiles').update(payload).eq('id', userId);

  if (error && isMissingColumnError(error, 'subscription_ends_at')) {
    const withoutEndsAt = { ...payload };
    delete withoutEndsAt.subscription_ends_at;
    ({ error } = await admin
      .from('profiles')
      .update(withoutEndsAt)
      .eq('id', userId));
  }

  if (error) {
    console.error('[profile subscription update]', {
      userId,
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return { ok: false, error: error.message };
  }

  const { data: profile, error: verifyError } = await admin
    .from('profiles')
    .select('subscription_status, stripe_subscription_id')
    .eq('id', userId)
    .maybeSingle();

  if (verifyError) {
    return { ok: false, error: verifyError.message };
  }

  if (!profile) {
    return { ok: false, error: 'Profile not found after subscription update' };
  }

  if (
    fields.subscription_status === 'active' &&
    profile.subscription_status !== 'active'
  ) {
    return {
      ok: false,
      error: 'Subscription status did not persist on profile',
    };
  }

  return { ok: true };
}

export async function profileHasActiveSubscription(
  userId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('subscription_status, stripe_subscription_id')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data?.stripe_subscription_id) {
    return false;
  }

  return hasPlatformAccess(data.subscription_status);
}
