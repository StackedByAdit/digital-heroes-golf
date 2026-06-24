import type { SupabaseClient } from '@supabase/supabase-js';

export const CHARITY_IMAGES_BUCKET = 'charity-images';

export const ALLOWED_CHARITY_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export const MAX_CHARITY_IMAGE_BYTES = 5 * 1024 * 1024;

export function extensionForCharityMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/gif':
      return 'gif';
    case 'image/webp':
      return 'webp';
    default:
      return 'bin';
  }
}

export function buildCharityImagePath(charityId: string, mime: string): string {
  const ext = extensionForCharityMime(mime);
  return `${charityId}/${Date.now()}.${ext}`;
}

export function getCharityImagePublicUrl(
  supabase: SupabaseClient,
  storagePath: string
): string {
  const { data } = supabase.storage.from(CHARITY_IMAGES_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}
