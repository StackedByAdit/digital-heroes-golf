import type { SupabaseClient } from '@supabase/supabase-js';
import type { DrawEntry, PaymentStatus } from '@/types';

export const WINNER_PROOFS_BUCKET = 'winner-proofs';
export const MAX_PROOF_FILE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_PROOF_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'application/pdf',
]);

export type WinnerDisplayStatus =
  | 'pending'
  | 'under_review'
  | 'paid'
  | 'rejected';

export type WinnerListRow = {
  id: string;
  draw_id: string;
  user_id: string;
  match_type: DrawEntry['match_type'];
  prize_amount: number;
  payment_status: PaymentStatus;
  proof_url: string | null;
  proof_signed_url: string | null;
  verified_at: string | null;
  created_at: string;
  winner_name: string;
  winner_email: string;
  draw_month: string;
};

export function extensionForMime(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/gif':
      return 'gif';
    case 'image/webp':
      return 'webp';
    case 'image/heic':
      return 'heic';
    case 'application/pdf':
      return 'pdf';
    default:
      return 'bin';
  }
}

export function buildProofStoragePath(
  userId: string,
  drawEntryId: string,
  extension: string
): string {
  return `${userId}/${drawEntryId}-${Date.now()}.${extension}`;
}

export function getWinnerDisplayStatus(entry: {
  payment_status: PaymentStatus;
  proof_url: string | null;
}): WinnerDisplayStatus {
  if (entry.payment_status === 'paid') return 'paid';
  if (entry.payment_status === 'rejected') return 'rejected';
  if (entry.proof_url) return 'under_review';
  return 'pending';
}

export function isWinningEntry(entry: {
  match_type: string | null;
  prize_amount: number;
}): boolean {
  return Boolean(entry.match_type && entry.prize_amount > 0);
}

export function winnerStatusLabel(status: WinnerDisplayStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'under_review':
      return 'Under Review';
    case 'paid':
      return 'Paid';
    case 'rejected':
      return 'Rejected';
  }
}

export function unwrapJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export async function createSignedProofUrl(
  admin: SupabaseClient,
  storagePath: string | null,
  expiresInSeconds = 3600
): Promise<string | null> {
  if (!storagePath) return null;

  const { data, error } = await admin.storage
    .from(WINNER_PROOFS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
