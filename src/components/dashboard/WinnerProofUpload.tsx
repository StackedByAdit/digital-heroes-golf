'use client';

import { Upload, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ALLOWED_PROOF_MIME_TYPES,
  getWinnerDisplayStatus,
  MAX_PROOF_FILE_BYTES,
  winnerStatusLabel,
} from '@/lib/winners/helpers';
import { cn, formatCurrency } from '@/lib/utils';
import type { DrawEntry } from '@/types';

interface WinnerProofUploadProps {
  entry: DrawEntry;
  drawMonth: string;
  id?: string;
  onUpdated?: () => void;
}

export function WinnerProofUpload({
  entry,
  drawMonth,
  id,
  onUpdated,
}: WinnerProofUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingProofUrl, setExistingProofUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const displayStatus = getWinnerDisplayStatus(entry);
  const canUpload = displayStatus === 'pending' || displayStatus === 'rejected';

  const loadExistingProof = useCallback(async () => {
    if (!entry.proof_url) {
      setExistingProofUrl(null);
      return;
    }

    try {
      const response = await fetch(
        `/api/winners/upload-proof?draw_entry_id=${entry.id}`
      );
      const data = await response.json();
      if (response.ok) {
        setExistingProofUrl(data.signed_url ?? null);
      }
    } catch {
      setExistingProofUrl(null);
    }
  }, [entry.id, entry.proof_url]);

  useEffect(() => {
    loadExistingProof();
  }, [loadExistingProof]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const statusStyles = useMemo(
    () => ({
      pending: 'bg-amber-100 text-amber-800',
      under_review: 'bg-blue-100 text-blue-800',
      paid: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800',
    }),
    []
  );

  function validateFile(nextFile: File): boolean {
    if (!ALLOWED_PROOF_MIME_TYPES.has(nextFile.type)) {
      toast.error('Please upload a JPG, PNG, GIF, WebP, HEIC, or PDF file');
      return false;
    }

    if (nextFile.size > MAX_PROOF_FILE_BYTES) {
      toast.error('File must be 5MB or smaller');
      return false;
    }

    return true;
  }

  function handleFileSelect(nextFile: File | null) {
    if (!nextFile || !validateFile(nextFile)) return;
    setFile(nextFile);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      toast.error('Please choose a file to upload');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('draw_entry_id', entry.id);
      formData.append('file', file);

      const response = await fetch('/api/winners/upload-proof', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Upload failed');

      setFile(null);
      setExistingProofUrl(data.signed_url ?? null);
      toast.success('Proof uploaded — awaiting review');
      onUpdated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  }

  const previewSource = previewUrl ?? existingProofUrl;
  const isPdfPreview =
    file?.type === 'application/pdf' ||
    (!file && existingProofUrl?.includes('.pdf'));

  return (
    <section
      id={id}
      className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-gray-900">
            🎉 You won {formatCurrency(Number(entry.prize_amount))} in the{' '}
            {drawMonth} draw!
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Match type: {entry.match_type}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold',
            statusStyles[displayStatus]
          )}
        >
          {winnerStatusLabel(displayStatus)}
        </span>
      </div>

      {displayStatus === 'paid' && (
        <p className="mt-4 text-sm font-medium text-emerald-800">
          Payment sent — thank you for verifying.
        </p>
      )}

      {displayStatus === 'under_review' && (
        <p className="mt-4 text-sm text-blue-800">
          Your proof is under review. We&apos;ll notify you once it&apos;s processed.
        </p>
      )}

      {displayStatus === 'rejected' && (
        <p className="mt-4 text-sm font-medium text-red-700">
          Your proof was rejected. Please upload a clearer image.
        </p>
      )}

      {canUpload && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              handleFileSelect(event.dataTransfer.files[0] ?? null);
            }}
            className={cn(
              'relative rounded-xl border-2 border-dashed bg-white p-8 text-center transition',
              dragOver
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-300 hover:border-emerald-400'
            )}
          >
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Drag & drop a screenshot of your scores from your golf platform
              (e.g. HowDidIDo, IG), or{' '}
              <label className="cursor-pointer font-semibold text-emerald-700 hover:text-emerald-900">
                browse files
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="sr-only"
                  onChange={(event) =>
                    handleFileSelect(event.target.files?.[0] ?? null)
                  }
                />
              </label>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Images or PDF, max 5MB
            </p>
          </div>

          {previewSource && (
            <div className="relative overflow-hidden rounded-lg border bg-white p-3">
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (!entry.proof_url) setExistingProofUrl(null);
                }}
                className="absolute right-2 top-2 rounded-md bg-white/90 p-1 shadow hover:bg-white"
                aria-label="Remove preview"
              >
                <X className="h-4 w-4" />
              </button>
              {isPdfPreview ? (
                <iframe
                  title="Proof preview"
                  src={previewSource}
                  className="h-64 w-full rounded"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSource}
                  alt="Proof preview"
                  className="mx-auto max-h-64 rounded object-contain"
                />
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !file}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {submitting ? 'Uploading…' : 'Submit proof'}
          </button>
        </form>
      )}

      {displayStatus === 'under_review' && previewSource && !canUpload && (
        <div className="mt-4 overflow-hidden rounded-lg border bg-white p-3">
          {isPdfPreview ? (
            <iframe
              title="Submitted proof"
              src={previewSource}
              className="h-64 w-full rounded"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSource}
              alt="Submitted proof"
              className="mx-auto max-h-64 rounded object-contain"
            />
          )}
        </div>
      )}
    </section>
  );
}
