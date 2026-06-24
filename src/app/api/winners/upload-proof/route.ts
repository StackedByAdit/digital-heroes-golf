import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/draw/processing';
import {
  ALLOWED_PROOF_MIME_TYPES,
  buildProofStoragePath,
  createSignedProofUrl,
  extensionForMime,
  isWinningEntry,
  MAX_PROOF_FILE_BYTES,
  WINNER_PROOFS_BUCKET,
} from '@/lib/winners/helpers';

export async function GET(request: Request) {
  const auth = await requireAuth();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const drawEntryId = searchParams.get('draw_entry_id');

  if (!drawEntryId) {
    return NextResponse.json(
      { error: 'draw_entry_id is required' },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const { data: entry, error } = await admin
      .from('draw_entries')
      .select('id, user_id, proof_url')
      .eq('id', drawEntryId)
      .maybeSingle();

    if (error || !entry?.proof_url) {
      return NextResponse.json({ error: 'Proof not found' }, { status: 404 });
    }

    const isOwner = entry.user_id === auth.user.id;
    if (!isOwner && !auth.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const signedUrl = await createSignedProofUrl(admin, entry.proof_url);
    if (!signedUrl) {
      return NextResponse.json(
        { error: 'Failed to generate proof URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({ signed_url: signedUrl });
  } catch (error) {
    console.error('[winners upload-proof GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch proof URL' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const drawEntryId = formData.get('draw_entry_id');
  const file = formData.get('file');

  if (typeof drawEntryId !== 'string' || !(file instanceof File)) {
    return NextResponse.json(
      { error: 'draw_entry_id and file are required' },
      { status: 400 }
    );
  }

  if (!ALLOWED_PROOF_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'File must be an image or PDF' },
      { status: 400 }
    );
  }

  if (file.size > MAX_PROOF_FILE_BYTES) {
    return NextResponse.json(
      { error: 'File must be 5MB or smaller' },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const { data: entry, error: entryError } = await admin
      .from('draw_entries')
      .select('*')
      .eq('id', drawEntryId)
      .maybeSingle();

    if (entryError || !entry) {
      return NextResponse.json({ error: 'Draw entry not found' }, { status: 404 });
    }

    if (entry.user_id !== auth.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isWinningEntry(entry)) {
      return NextResponse.json(
        { error: 'This entry is not a winning draw entry' },
        { status: 400 }
      );
    }

    if (entry.payment_status !== 'pending' && entry.payment_status !== 'rejected') {
      return NextResponse.json(
        { error: 'Proof cannot be uploaded for this entry' },
        { status: 400 }
      );
    }

    const extension = extensionForMime(file.type);
    const storagePath = buildProofStoragePath(
      auth.user.id,
      drawEntryId,
      extension
    );

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage
      .from(WINNER_PROOFS_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: updated, error: updateError } = await admin
      .from('draw_entries')
      .update({
        proof_url: storagePath,
        payment_status: 'pending',
        verified_at: null,
      })
      .eq('id', drawEntryId)
      .select('*')
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    const signedUrl = await createSignedProofUrl(admin, storagePath);

    return NextResponse.json({
      success: true,
      draw_entry: updated,
      signed_url: signedUrl,
    });
  } catch (error) {
    console.error('[winners upload-proof POST]', error);
    return NextResponse.json(
      { error: 'Failed to upload proof' },
      { status: 500 }
    );
  }
}
