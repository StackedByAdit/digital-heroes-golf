import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/draw/processing';
import {
  ALLOWED_CHARITY_IMAGE_TYPES,
  buildCharityImagePath,
  CHARITY_IMAGES_BUCKET,
  getCharityImagePublicUrl,
  MAX_CHARITY_IMAGE_BYTES,
} from '@/lib/charity/storage';

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const charityId = formData.get('charity_id');
  const file = formData.get('file');

  if (typeof charityId !== 'string' || !(file instanceof File)) {
    return NextResponse.json(
      { error: 'charity_id and file are required' },
      { status: 400 }
    );
  }

  if (!ALLOWED_CHARITY_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_CHARITY_IMAGE_TYPES)[number])) {
    return NextResponse.json(
      { error: 'File must be JPEG, PNG, GIF, or WebP' },
      { status: 400 }
    );
  }

  if (file.size > MAX_CHARITY_IMAGE_BYTES) {
    return NextResponse.json({ error: 'File must be 5 MB or smaller' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: charity, error: charityError } = await admin
      .from('charities')
      .select('id')
      .eq('id', charityId)
      .maybeSingle();

    if (charityError || !charity) {
      return NextResponse.json({ error: 'Charity not found' }, { status: 404 });
    }

    const storagePath = buildCharityImagePath(charityId, file.type);
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from(CHARITY_IMAGES_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw new Error(uploadError.message);

    const publicUrl = getCharityImagePublicUrl(admin, storagePath);

    await admin
      .from('charities')
      .update({ image_url: publicUrl })
      .eq('id', charityId);

    return NextResponse.json({ public_url: publicUrl, storage_path: storagePath });
  } catch (error) {
    console.error('[charity upload-image]', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
