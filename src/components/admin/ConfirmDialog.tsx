'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConfirmVariant = 'danger' | 'warning' | 'default';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex flex-col items-center gap-4 text-center">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                isDanger && 'bg-red-100 text-red-600',
                isWarning && 'bg-amber-100 text-amber-600',
                !isDanger && !isWarning && 'bg-gray-100 text-gray-600',
              )}
            >
              {isDanger ? (
                <Trash2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>

            <div className="space-y-1">
              <Dialog.Title className="text-base font-semibold text-gray-900">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-sm leading-relaxed text-gray-500">
                  {description}
                </Dialog.Description>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="btn-interactive flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                'btn-interactive flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50',
                isDanger && 'bg-red-600 hover:bg-red-700',
                isWarning && 'bg-amber-600 hover:bg-amber-700',
                !isDanger && !isWarning && 'bg-brand-green hover:bg-brand-green/90',
              )}
            >
              {loading ? 'Please wait…' : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
