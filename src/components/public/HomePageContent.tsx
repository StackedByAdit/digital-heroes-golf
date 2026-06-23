'use client';

import Link from 'next/link';
import { Heart, PenLine, Trophy } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { excerpt } from '@/lib/charity/helpers';
import { formatCurrency } from '@/lib/utils';
import type { Charity } from '@/types';
import type { PublicStats } from '@/lib/public/stats';

type HomePageContentProps = {
  stats: PublicStats;
  featuredCharity: Charity | null;
};

const STEPS = [
  {
    icon: Heart,
    title: 'Subscribe',
    description: 'Choose monthly or yearly and pick the charity you want to support.',
  },
  {
    icon: PenLine,
    title: 'Enter Scores',
    description: 'Log your monthly Stableford scores — your last five form your draw numbers.',
  },
  {
    icon: Trophy,
    title: 'Win & Give',
    description: 'Match numbers in the monthly draw and share prizes with fellow players.',
  },
];

const TESTIMONIALS = [
  {
    name: 'James R.',
    location: 'Surrey',
    quote:
      'I love that every round I play can help a charity I care about — and the monthly draw keeps it exciting.',
  },
  {
    name: 'Sarah M.',
    location: 'Edinburgh',
    quote:
      'Simple to use, transparent prizes, and a brilliant way to combine golf with giving back.',
  },
  {
    name: 'David K.',
    location: 'Bristol',
    quote:
      'Won a 4-match prize in my second month. The whole experience feels fair and well run.',
  },
];

export function HomePageContent({ stats, featuredCharity }: HomePageContentProps) {
  return (
    <>
      <section className="relative flex min-h-[85vh] items-center overflow-hidden bg-brand-green sm:min-h-[92vh]">
        <div className="hero-path" aria-hidden />
        <div className="hero-ball hero-ball-1" aria-hidden />
        <div className="hero-ball hero-ball-2" aria-hidden />
        <div className="hero-ball hero-ball-3" aria-hidden />
        <div className="hero-ball hero-ball-4" aria-hidden />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <ScrollReveal className="mx-auto flex max-w-3xl flex-col items-center text-center lg:mx-0 lg:items-start lg:text-left">
            <p className="mb-4 inline-flex rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-1 text-sm font-medium text-brand-gold">
              <AnimatedCounter
                value={stats.charity_raised_this_month}
                prefix="£"
              />{' '}
              raised for charity this month
            </p>
            <h1 className="font-display text-3xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Play Golf. Win Prizes. Change Lives.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-brand-cream/85 sm:text-lg">
              Enter your scores, join monthly draws, and support the charities that
              matter most to you.
            </p>
            <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
              <Link
                href="/pricing"
                className="btn-interactive btn-cta rounded-full bg-brand-gold px-8 py-3.5 text-center text-sm font-semibold text-brand-charcoal transition hover:bg-brand-gold/90"
              >
                Start Playing
              </Link>
              <Link
                href="/charities"
                className="btn-interactive rounded-full border border-white/30 px-8 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/10"
              >
                See the Charities
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-gold">
            Simple by design
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-brand-green sm:text-4xl">
            How it works
          </h2>
        </ScrollReveal>

        <div className="mt-10 grid gap-6 sm:mt-14 sm:gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <ScrollReveal key={step.title} delay={index * 0.12}>
                <div className="dashboard-card group rounded-2xl border border-brand-green/10 bg-white p-6 sm:p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green/10 text-brand-green transition group-hover:bg-brand-gold/20 group-hover:text-brand-gold">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-brand-gold">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-semibold text-brand-green">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-brand-charcoal/70">
                    {step.description}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {featuredCharity && (
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 bg-brand-green"
            style={
              featuredCharity.image_url
                ? {
                    backgroundImage: `linear-gradient(to right, rgba(26,60,46,0.92), rgba(26,60,46,0.75)), url(${featuredCharity.image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
            <ScrollReveal className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-gold">
                This Month&apos;s Featured Cause
              </p>
              <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">
                {featuredCharity.name}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-brand-cream/85 sm:text-lg">
                {excerpt(featuredCharity.description, 160)}
              </p>
              <Link
                href={`/charities/${featuredCharity.id}`}
                className="btn-interactive btn-cta mt-8 inline-flex rounded-full bg-brand-gold px-8 py-3.5 text-sm font-semibold text-brand-charcoal transition hover:bg-brand-gold/90"
              >
                Support Now
              </Link>
            </ScrollReveal>
          </div>
        </section>
      )}

      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center">
            <h2 className="font-display text-3xl font-bold text-brand-green sm:text-4xl">
              This month&apos;s draw
            </h2>
            <p className="mt-3 text-brand-charcoal/70">
              Real numbers. Real prizes. Real community impact.
            </p>
          </ScrollReveal>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:mt-12 md:grid-cols-3">
            <ScrollReveal delay={0.05}>
              <div className="dashboard-card rounded-2xl border border-brand-green/10 bg-brand-cream p-6 text-center sm:p-8">
                <p className="text-sm font-medium text-brand-charcoal/60">Current prize pool</p>
                <p className="prize-pulse mt-3 font-display text-3xl font-bold text-brand-green">
                  <AnimatedCounter
                    value={stats.prize_pool}
                    format={(n) => formatCurrency(n)}
                  />
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <div className="dashboard-card rounded-2xl border border-brand-green/10 bg-brand-cream p-6 text-center sm:p-8">
                <p className="text-sm font-medium text-brand-charcoal/60">Active players</p>
                <p className="mt-3 font-display text-3xl font-bold text-brand-green">
                  <AnimatedCounter value={stats.active_players} />
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.15}>
              <div className="dashboard-card rounded-2xl border border-brand-green/10 bg-brand-cream p-6 text-center sm:p-8">
                <p className="text-sm font-medium text-brand-charcoal/60">Next draw</p>
                <p className="mt-3 font-display text-2xl font-bold text-brand-green sm:text-3xl">
                  {stats.next_draw_label}
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center">
          <h2 className="font-display text-3xl font-bold text-brand-green sm:text-4xl">
            Stories from our community
          </h2>
        </ScrollReveal>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:mt-12 md:grid-cols-3">
          {TESTIMONIALS.map((item, index) => (
            <ScrollReveal key={item.name} delay={index * 0.1}>
              <blockquote className="dashboard-card flex h-full flex-col rounded-2xl border border-brand-green/10 bg-white p-6 shadow-sm sm:p-8">
                <p className="flex-1 text-sm leading-relaxed text-brand-charcoal/80">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <footer className="mt-6 border-t border-brand-green/10 pt-4">
                  <p className="font-semibold text-brand-green">{item.name}</p>
                  <p className="text-xs text-brand-charcoal/50">{item.location}</p>
                </footer>
              </blockquote>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="bg-brand-green py-16 sm:py-24">
        <ScrollReveal className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Ready to play your part?
          </h2>
          <p className="mt-4 text-brand-cream/80">
            Join a community where every round supports a cause — and every month
            brings a new chance to win.
          </p>
          <Link
            href="/pricing"
            className="btn-interactive btn-cta mt-8 inline-flex rounded-full bg-brand-gold px-10 py-4 text-sm font-semibold text-brand-charcoal transition hover:bg-brand-gold/90"
          >
            Subscribe today
          </Link>
          <p className="mt-4 text-xs text-brand-cream/60">
            Cancel anytime on monthly plans. 14-day money-back guarantee on your first month.
          </p>
        </ScrollReveal>
      </section>
    </>
  );
}
