'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { format } from 'date-fns';
import { CreditCard, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan, SubscriptionStatus } from '@/types';

interface SubscriptionStatusProps {
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus;
  renewalDate: string | null;
}

const STATUS_STYLES: Record<
  SubscriptionStatus,
  { label: string; className: string }
> = {
  active: {
    label: 'Active',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  past_due: {
    label: 'Past Due',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
};

function planLabel(plan: SubscriptionPlan | null) {
  if (plan === 'monthly') return 'Monthly';
  if (plan === 'yearly') return 'Yearly';
  return 'No plan';
}

export function SubscriptionStatus({
  plan,
  status,
  renewalDate,
}: SubscriptionStatusProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [loading, setLoading] = useState<'portal' | 'cancel' | null>(null);

  const statusStyle = STATUS_STYLES[status];

  async function handleManageBilling() {
    setLoading('portal');
    try {
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to open billing portal');
      }

      window.location.href = data.url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to open billing portal'
      );
    } finally {
      setLoading(null);
    }
  }

  async function handleCancelPlan() {
    setLoading('cancel');
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to cancel subscription');
      }

      toast.success(data.message ?? 'Subscription cancelled');
      setCancelOpen(false);
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to cancel subscription'
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Subscription</p>
          <h2 className="mt-1 text-xl font-semibold text-gray-900">
            {planLabel(plan)}
          </h2>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
            statusStyle.className
          )}
        >
          {statusStyle.label}
        </span>
      </div>

      <div className="mt-4 space-y-1 text-sm text-gray-600">
        <p>
          <span className="font-medium text-gray-800">Renewal date:</span>{' '}
          {renewalDate
            ? format(new Date(renewalDate), 'd MMMM yyyy')
            : 'Not available'}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleManageBilling}
          disabled={loading !== null || status === 'inactive'}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CreditCard className="h-4 w-4" />
          {loading === 'portal' ? 'Opening…' : 'Manage Billing'}
        </button>

        {status === 'active' && (
          <Dialog.Root open={cancelOpen} onOpenChange={setCancelOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                disabled={loading !== null}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel Plan
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Cancel subscription?
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Dialog.Close>
                </div>
                <Dialog.Description className="mt-2 text-sm text-gray-600">
                  Your plan will be set to cancelled and dashboard access will be
                  restricted immediately. Billing may continue until the end of
                  your current Stripe billing period.
                </Dialog.Description>
                <div className="mt-6 flex justify-end gap-3">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Keep Plan
                    </button>
                  </Dialog.Close>
                  <button
                    type="button"
                    onClick={handleCancelPlan}
                    disabled={loading === 'cancel'}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading === 'cancel' ? 'Cancelling…' : 'Confirm Cancel'}
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}
      </div>
    </div>
  );
}
