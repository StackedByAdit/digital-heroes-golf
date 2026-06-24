'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Heart, Search } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { cn, formatCurrency } from '@/lib/utils';
import type { Charity } from '@/types';

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

export function DonateForm() {
  const searchParams = useSearchParams();
  const initialCharityId = searchParams.get('charity') ?? '';

  const [charities, setCharities] = useState<Charity[]>([]);
  const [charitySearch, setCharitySearch] = useState('');
  const [selectedCharityId, setSelectedCharityId] = useState(initialCharityId);
  const [amount, setAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [charitiesLoading, setCharitiesLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setIsLoggedIn(true);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.full_name) setDonorName(profile.full_name);
        if (profile?.email) setDonorEmail(profile.email);
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    async function loadCharities() {
      setCharitiesLoading(true);
      try {
        const response = await fetch('/api/charities');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? 'Failed to load charities');
        setCharities(data.charities ?? []);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to load charities'
        );
      } finally {
        setCharitiesLoading(false);
      }
    }

    loadCharities();
  }, []);

  const filteredCharities = useMemo(() => {
    const term = charitySearch.trim().toLowerCase();
    if (!term) return charities;
    return charities.filter(
      (charity) =>
        charity.name.toLowerCase().includes(term) ||
        charity.description.toLowerCase().includes(term)
    );
  }, [charities, charitySearch]);

  const selectedCharity = charities.find(
    (charity) => charity.id === selectedCharityId
  );

  const effectiveAmount = customAmount
    ? Number.parseFloat(customAmount)
    : amount;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedCharityId) {
      toast.error('Please choose a charity');
      return;
    }

    if (!Number.isFinite(effectiveAmount) || effectiveAmount < 1) {
      toast.error('Enter a donation amount of at least £1');
      return;
    }

    if (!isLoggedIn && !donorEmail.trim()) {
      toast.error('Email is required for guest donations');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/donations/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          charity_id: selectedCharityId,
          amount_gbp: effectiveAmount,
          donor_name: donorName.trim() || undefined,
          donor_email: isLoggedIn ? undefined : donorEmail.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Checkout failed');

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error('No checkout URL returned');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Choose a charity</h2>
        <p className="mt-1 text-sm text-gray-600">
          100% of your donation goes directly to the charity you select.
        </p>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search charities…"
            value={charitySearch}
            onChange={(event) => setCharitySearch(event.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm"
          />
        </div>

        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {charitiesLoading ? (
            <p className="text-sm text-gray-500">Loading charities…</p>
          ) : filteredCharities.length === 0 ? (
            <p className="text-sm text-gray-500">No charities match your search.</p>
          ) : (
            filteredCharities.map((charity) => {
              const selected = charity.id === selectedCharityId;
              return (
                <button
                  key={charity.id}
                  type="button"
                  onClick={() => setSelectedCharityId(charity.id)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition',
                    selected
                      ? 'border-brand-green bg-brand-green/5 ring-1 ring-brand-green/30'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
                    <Heart className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{charity.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">
                      {charity.description}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Donation amount</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setAmount(preset);
                setCustomAmount('');
              }}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition',
                !customAmount && amount === preset
                  ? 'border-brand-green bg-brand-green text-white'
                  : 'border-gray-300 text-gray-700 hover:border-brand-green'
              )}
            >
              {formatCurrency(preset)}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Custom amount (£)
          </label>
          <input
            type="number"
            min={1}
            max={10000}
            step={0.01}
            value={customAmount}
            onChange={(event) => setCustomAmount(event.target.value)}
            placeholder="Enter amount"
            className="mt-1 w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </section>

      {!isLoggedIn && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Your details</h2>
          <p className="mt-1 text-sm text-gray-600">
            We&apos;ll send your receipt to this email.{' '}
            <Link href="/login" className="font-medium text-brand-green underline">
              Log in
            </Link>{' '}
            to skip this step.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Name</span>
              <input
                value={donorName}
                onChange={(event) => setDonorName(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Email</span>
              <input
                type="email"
                value={donorEmail}
                onChange={(event) => setDonorEmail(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </label>
          </div>
        </section>
      )}

      <div className="rounded-2xl border border-brand-green/20 bg-brand-green/5 p-6">
        {selectedCharity ? (
          <p className="text-sm text-gray-700">
            You&apos;re donating{' '}
            <strong className="text-brand-green">
              {formatCurrency(Number.isFinite(effectiveAmount) ? effectiveAmount : 0)}
            </strong>{' '}
            to <strong>{selectedCharity.name}</strong>.
          </p>
        ) : (
          <p className="text-sm text-gray-600">Select a charity to continue.</p>
        )}

        <button
          type="submit"
          disabled={loading || !selectedCharityId}
          className="btn-interactive btn-cta mt-4 w-full rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-charcoal disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {loading ? 'Redirecting to checkout…' : 'Donate securely with Stripe'}
        </button>
      </div>
    </form>
  );
}
