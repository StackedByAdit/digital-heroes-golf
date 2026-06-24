'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError('Enter your email address first, then click forgot password.');
      return;
    }

    setError(null);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard/account`,
    });

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setResetSent(true);
    toast.success('Password reset email sent');
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-brand-green/10 bg-white p-8 shadow-sm">
      <h1 className="font-display text-3xl font-bold text-brand-green">Welcome back</h1>
      <p className="mt-2 text-sm text-brand-charcoal/60">
        Sign in to manage your scores, draws, and charity giving.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-brand-charcoal">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-brand-green/15 px-3 py-2.5 text-sm outline-none ring-brand-gold focus:border-brand-gold focus:ring-2"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-brand-charcoal">
              Password
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs font-medium text-brand-gold hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-brand-green/15 px-3 py-2.5 text-sm outline-none ring-brand-gold focus:border-brand-gold focus:ring-2"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {resetSent && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Check your inbox for a password reset link.
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand-green py-3 text-sm font-semibold text-white transition hover:bg-brand-green/90 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-brand-charcoal/60">
        Don&apos;t have an account?{' '}
        <Link href="/pricing" className="font-medium text-brand-gold hover:underline">
          Start here
        </Link>
      </p>
    </div>
  );
}
