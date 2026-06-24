'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { SubscriptionStatus } from '@/components/dashboard/SubscriptionStatus';
import type { DashboardProfile } from '@/lib/dashboard/data';

interface AccountSettingsProps {
  profile: DashboardProfile;
}

export function AccountSettings({ profile }: AccountSettingsProps) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [savingProfile, setSavingProfile] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function handleProfileSave(event: React.FormEvent) {
    event.preventDefault();
    setSavingProfile(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', profile.id);

      if (error) throw new Error(error.message);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSave(event: React.FormEvent) {
    event.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);

      setPassword('');
      setConfirmPassword('');
      toast.success('Password updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Password update failed');
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleCancelSubscription() {
    setCancelling(true);
    try {
      const response = await fetch('/api/subscriptions/cancel', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Cancel failed');

      toast.success(data.message ?? 'Subscription cancelled');
      setCancelOpen(false);
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Cancel failed');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        <form onSubmit={handleProfileSave} className="mt-4 max-w-md space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Full name</span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Email</span>
            <input
              value={profile.email}
              readOnly
              className="mt-1 w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-500"
            />
          </label>
          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {savingProfile ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Change password</h2>
        <form onSubmit={handlePasswordSave} className="mt-4 max-w-md space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-gray-700">New password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              minLength={8}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Confirm password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              minLength={8}
            />
          </label>
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {savingPassword ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>

      <SubscriptionStatus
        plan={profile.subscription_plan}
        status={profile.subscription_status}
        renewalDate={profile.renewalDate}
      />

      <section className="rounded-xl border border-red-200 bg-red-50/40 p-6">
        <h2 className="text-lg font-semibold text-red-900">Danger zone</h2>
        <p className="mt-2 text-sm text-red-800">
          Cancelling your subscription will restrict dashboard access immediately.
        </p>
        <Dialog.Root open={cancelOpen} onOpenChange={setCancelOpen}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Cancel subscription
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white p-6 shadow-xl">
              <Dialog.Title className="text-lg font-semibold">
                Cancel subscription?
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-gray-600">
                This action cannot be undone from the dashboard. You will lose access
                to score entry and draw participation.
              </Dialog.Description>
              <div className="mt-6 flex justify-end gap-3">
                <Dialog.Close asChild>
                  <button type="button" className="rounded-lg border px-4 py-2 text-sm">
                    Keep subscription
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling…' : 'Confirm cancel'}
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </section>
    </div>
  );
}
