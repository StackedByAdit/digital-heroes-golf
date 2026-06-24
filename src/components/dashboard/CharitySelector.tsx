'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  calculateCharityContribution,
  excerpt,
} from '@/lib/charity/helpers';
import { cn, formatCurrency } from '@/lib/utils';
import type { Charity, Profile } from '@/types';

interface CharitySelectorProps {
  profile: Profile;
  currentCharity: Charity | null;
}

export function CharitySelector({
  profile: initialProfile,
  currentCharity: initialCharity,
}: CharitySelectorProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [currentCharity, setCurrentCharity] = useState(initialCharity);
  const [open, setOpen] = useState(false);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCharityId, setSelectedCharityId] = useState(
    profile.charity_id ?? ''
  );
  const [percentage, setPercentage] = useState(profile.charity_percentage);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCharities, setLoadingCharities] = useState(false);

  useEffect(() => {
    if (!open) return;

    async function loadCharities() {
      setLoadingCharities(true);
      try {
        const response = await fetch('/api/charities');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? 'Failed to load charities');
        setCharities(data.charities ?? []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load charities');
      } finally {
        setLoadingCharities(false);
      }
    }

    loadCharities();
  }, [open]);

  const filteredCharities = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return charities;
    return charities.filter((charity) =>
      charity.name.toLowerCase().includes(term)
    );
  }, [charities, search]);

  const contribution = calculateCharityContribution(
    profile.subscription_plan,
    percentage
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedCharityId) {
      toast.error('Please select a charity');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/user/charity', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          charity_id: selectedCharityId,
          charity_percentage: percentage,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Update failed');

      setProfile(data.profile);
      const selected = charities.find((c) => c.id === selectedCharityId) ?? null;
      setCurrentCharity(selected);
      setOpen(false);
      toast.success('Charity preference updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Your charity</h2>

      {currentCharity ? (
        <div className="mt-4 flex gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
            {currentCharity.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentCharity.image_url}
                alt={currentCharity.name}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{currentCharity.name}</p>
            <p className="mt-1 text-sm text-gray-600">
              {excerpt(currentCharity.description, 140)}
            </p>
            <p className="mt-2 text-sm font-medium text-emerald-700">
              You&apos;re contributing {formatCurrency(contribution)} per month to{' '}
              {currentCharity.name} ({percentage}%)
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-gray-600">
          You haven&apos;t selected a charity yet.
        </p>
      )}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="mt-5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Change Charity
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <Dialog.Title className="text-lg font-semibold">
                Change charity
              </Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="rounded-md p-1 hover:bg-gray-100">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
              <div className="space-y-4 overflow-y-auto px-6 py-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Search charities…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm"
                  />
                </div>

                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {loadingCharities ? (
                    <p className="text-sm text-gray-500">Loading…</p>
                  ) : (
                    filteredCharities.map((charity) => (
                      <label
                        key={charity.id}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm',
                          selectedCharityId === charity.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200'
                        )}
                      >
                        <input
                          type="radio"
                          name="charity"
                          value={charity.id}
                          checked={selectedCharityId === charity.id}
                          onChange={() => setSelectedCharityId(charity.id)}
                          className="mt-1"
                        />
                        <span>
                          <span className="font-medium text-gray-900">
                            {charity.name}
                          </span>
                          <span className="mt-1 block text-gray-600">
                            {excerpt(charity.description, 90)}
                          </span>
                        </span>
                      </label>
                    ))
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Contribution: {percentage}%
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={percentage}
                    onChange={(event) => setPercentage(Number(event.target.value))}
                    className="w-full"
                  />
                  <p className="mt-2 text-sm text-emerald-700">
                    Estimated contribution: {formatCurrency(contribution)} per month
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t px-6 py-4">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
