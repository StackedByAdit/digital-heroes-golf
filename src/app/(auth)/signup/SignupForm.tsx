'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  SUBSCRIPTION_MONTHLY_GBP,
  SUBSCRIPTION_YEARLY_GBP,
  calculateCharityContribution,
  excerpt,
} from '@/lib/charity/helpers';
import { cn, formatCurrency } from '@/lib/utils';
import type { Charity, SubscriptionPlan } from '@/types';

type Step = 1 | 2 | 3;

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialPlan =
    searchParams.get('plan') === 'yearly' ? 'yearly' : 'monthly';
  const initialCharityId = searchParams.get('charity') ?? '';

  const [step, setStep] = useState<Step>(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [charities, setCharities] = useState<Charity[]>([]);
  const [charitySearch, setCharitySearch] = useState('');
  const [selectedCharityId, setSelectedCharityId] = useState(initialCharityId);
  const [charityPercentage, setCharityPercentage] = useState(25);
  const [plan, setPlan] = useState<SubscriptionPlan>(initialPlan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadCharities() {
      const response = await fetch('/api/charities');
      const data = await response.json();
      if (response.ok) {
        setCharities(data.charities ?? []);
      }
    }
    loadCharities();
  }, []);

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const stepParam = searchParams.get('step');
        if (stepParam === '2') setStep(2);
        else if (stepParam === '3') setStep(3);
      }
    }
    checkSession();
  }, [searchParams]);

  const filteredCharities = useMemo(() => {
    const term = charitySearch.trim().toLowerCase();
    if (!term) return charities;
    return charities.filter((charity) =>
      charity.name.toLowerCase().includes(term)
    );
  }, [charities, charitySearch]);

  const selectedCharity = charities.find(
    (charity) => charity.id === selectedCharityId
  );

  const contribution = calculateCharityContribution(plan, charityPercentage);

  async function handleStep1(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.user) {
        setError('Account could not be created. Please try again.');
        return;
      }

      setUserId(data.user.id);

      await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', data.user.id);

      if (data.session) {
        setStep(2);
      } else {
        toast.info('Check your email to confirm your account, then continue signup.');
        router.push('/login?redirectTo=/signup?step=2');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedCharityId) {
      setError('Please select a charity');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          charity_id: selectedCharityId,
          charity_percentage: charityPercentage,
        })
        .eq('id', userId!);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setStep(3);
    } catch {
      setError('Failed to save charity preferences.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStep3() {
    if (!selectedCharityId) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          charityId: selectedCharityId,
          charityPercentage,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Checkout failed');

      window.location.href = data.url;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : 'Unable to start checkout'
      );
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-brand-charcoal/50">
          <span className={step >= 1 ? 'text-brand-gold' : ''}>Account</span>
          <span className={step >= 2 ? 'text-brand-gold' : ''}>Charity</span>
          <span className={step >= 3 ? 'text-brand-gold' : ''}>Plan</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-green/10">
          <div
            className="h-full rounded-full bg-brand-gold transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-brand-charcoal/60">Step {step} of 3</p>
      </div>

      <div className="rounded-2xl border border-brand-green/10 bg-white p-8 shadow-sm">
        {step === 1 && (
          <>
            <h1 className="font-display text-3xl font-bold text-brand-green">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-brand-charcoal/60">
              Join a community where golf supports the causes you care about.
            </p>

            <form onSubmit={handleStep1} className="mt-8 space-y-5">
              <Field label="Full name" id="fullName">
                <input
                  id="fullName"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Email" id="email">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Password" id="password">
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={inputClass}
                />
              </Field>
              {error && <ErrorMessage message={error} />}
              <button type="submit" disabled={loading} className={buttonClass}>
                {loading ? 'Creating account…' : 'Continue'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="font-display text-3xl font-bold text-brand-green">
              Choose your charity
            </h1>
            <p className="mt-2 text-sm text-brand-charcoal/60">
              Select a cause and set how much of your subscription goes to them.
            </p>

            <form onSubmit={handleStep2} className="mt-8 space-y-6">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-charcoal/40" />
                <input
                  type="search"
                  placeholder="Search charities…"
                  value={charitySearch}
                  onChange={(event) => setCharitySearch(event.target.value)}
                  className={`${inputClass} pl-10`}
                />
              </div>

              <div className="grid max-h-64 gap-3 overflow-y-auto sm:grid-cols-2">
                {filteredCharities.map((charity) => (
                  <button
                    key={charity.id}
                    type="button"
                    onClick={() => setSelectedCharityId(charity.id)}
                    className={cn(
                      'rounded-xl border p-4 text-left transition',
                      selectedCharityId === charity.id
                        ? 'border-brand-gold bg-brand-gold/10 ring-2 ring-brand-gold/30'
                        : 'border-brand-green/10 hover:border-brand-green/25'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-brand-green/10">
                        {charity.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={charity.image_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-semibold text-brand-green">{charity.name}</p>
                        <p className="mt-1 text-xs text-brand-charcoal/60">
                          {excerpt(charity.description, 60)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-brand-green">Contribution</span>
                  <span className="font-semibold text-brand-gold">{charityPercentage}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={charityPercentage}
                  onChange={(event) =>
                    setCharityPercentage(Number(event.target.value))
                  }
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-brand-green/15 accent-brand-gold"
                />
                {selectedCharity && (
                  <p className="mt-2 text-sm text-brand-charcoal/70">
                    {formatCurrency(contribution)}/month to {selectedCharity.name}
                  </p>
                )}
              </div>

              {error && <ErrorMessage message={error} />}
              <button type="submit" disabled={loading} className={buttonClass}>
                {loading ? 'Saving…' : 'Continue to plan'}
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="font-display text-3xl font-bold text-brand-green">
              Choose your plan
            </h1>
            <p className="mt-2 text-sm text-brand-charcoal/60">
              Complete signup with secure Stripe checkout.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <PlanOption
                name="Monthly"
                price={SUBSCRIPTION_MONTHLY_GBP}
                period="month"
                selected={plan === 'monthly'}
                onSelect={() => setPlan('monthly')}
              />
              <PlanOption
                name="Yearly"
                price={SUBSCRIPTION_YEARLY_GBP}
                period="year"
                badge="Save £20"
                selected={plan === 'yearly'}
                onSelect={() => setPlan('yearly')}
              />
            </div>

            {selectedCharity && (
              <p className="mt-6 rounded-lg bg-brand-cream px-4 py-3 text-sm text-brand-charcoal/80">
                {charityPercentage}% ({formatCurrency(contribution)}/mo) supports{' '}
                <strong>{selectedCharity.name}</strong>
              </p>
            )}

            {error && (
              <div className="mt-4">
                <ErrorMessage message={error} />
              </div>
            )}

            <button
              type="button"
              onClick={handleStep3}
              disabled={loading}
              className={`${buttonClass} mt-6`}
            >
              {loading ? 'Redirecting to checkout…' : 'Continue to Stripe Checkout'}
            </button>
          </>
        )}

        <p className="mt-6 text-center text-sm text-brand-charcoal/60">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand-gold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputClass =
  'mt-1.5 w-full rounded-lg border border-brand-green/15 px-3 py-2.5 text-sm outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30';

const buttonClass =
  'w-full rounded-full bg-brand-green py-3 text-sm font-semibold text-white transition hover:bg-brand-green/90 disabled:opacity-50';

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-brand-charcoal">
        {label}
      </label>
      {children}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
      {message}
    </p>
  );
}

function PlanOption({
  name,
  price,
  period,
  badge,
  selected,
  onSelect,
}: {
  name: string;
  price: number;
  period: string;
  badge?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative rounded-xl border p-6 text-left transition',
        selected
          ? 'border-brand-gold bg-brand-gold/10 ring-2 ring-brand-gold/30'
          : 'border-brand-green/10 hover:border-brand-green/25'
      )}
    >
      {badge && (
        <span className="absolute -top-2 right-4 rounded-full bg-brand-gold px-2 py-0.5 text-xs font-bold text-brand-charcoal">
          {badge}
        </span>
      )}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-lg font-bold text-brand-green">{name}</p>
          <p className="mt-1">
            <span className="text-2xl font-bold">{formatCurrency(price)}</span>
            <span className="text-sm text-brand-charcoal/60">/{period}</span>
          </p>
        </div>
        {selected && <Check className="h-5 w-5 text-brand-gold" />}
      </div>
    </button>
  );
}
