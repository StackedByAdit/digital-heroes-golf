'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Heart, PenLine, Sparkles, Trophy } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { LandingAuthActions } from '@/components/auth/LandingAuthActions';
import { charityDisplayImage, excerpt } from '@/lib/charity/helpers';
import { formatCurrency } from '@/lib/utils';
import type { Charity } from '@/types';
import type { PublicStats } from '@/lib/public/stats';

type HomePageContentProps = {
  stats: PublicStats;
  featuredCharity: Charity | null;
  initialAuthenticated?: boolean;
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

export function HomePageContent({
  stats,
  featuredCharity,
  initialAuthenticated = false,
}: HomePageContentProps) {
  return (
    <>
      <section className="relative -mt-[4.5rem] flex min-h-screen items-center justify-center overflow-hidden">
        <Image
          src="/images/hero-meadow.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="hero-meadow-overlay absolute inset-0" aria-hidden />

        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 pb-28 pt-28 text-center sm:px-6 sm:pt-32">
          <ScrollReveal className="flex flex-col items-center">
            <p className="glass-pill mb-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/95">
              <AnimatedCounter value={stats.charity_raised_this_month} prefix="£" />
              <span>raised for charity this month</span>
            </p>

            <h1 className="font-script text-5xl font-semibold leading-[1.1] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.25rem]">
              Play golf. Win prizes.
              <br />
              Change lives — effortlessly.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
              Log your scores, enter monthly draws, support charities you believe in,
              and donate anytime — all in one place.
            </p>

            <LandingAuthActions initialAuthenticated={initialAuthenticated} variant="hero" />
          </ScrollReveal>
        </div>

        <Link
          href="/charities"
          className="glass-panel btn-interactive absolute bottom-8 left-4 z-10 hidden items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white sm:flex sm:left-8"
        >
          <ArrowUpRight className="h-4 w-4" />
          Explore charities
        </Link>

        <Link
          href="/donate"
          aria-label="Make a donation"
          className="glass-panel btn-interactive absolute bottom-8 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-2xl text-white sm:right-8"
        >
          <Sparkles className="h-5 w-5" />
        </Link>
      </section>

      <section className="relative bg-brand-cream/95 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-gold">
              Simple by design
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-brand-green sm:text-4xl">
              How it works
            </h2>
          </ScrollReveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <ScrollReveal key={step.title} delay={index * 0.1}>
                  <div className="glass-card group h-full">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green transition group-hover:bg-brand-gold/20 group-hover:text-brand-gold">
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
        </div>
      </section>

      {featuredCharity && (
        <section className="relative min-h-[28rem] overflow-hidden py-20 sm:min-h-[32rem] sm:py-28">
          <Image
            src={
              charityDisplayImage(featuredCharity, 'featured') ??
              '/images/hero-meadow.jpg'
            }
            alt=""
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-brand-green/70" aria-hidden />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-gold">
                Featured cause
              </p>
              <h2 className="mt-4 font-script text-4xl font-semibold text-white sm:text-5xl">
                {featuredCharity.name}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/85 sm:text-lg">
                {excerpt(featuredCharity.description, 180)}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href={`/charities/${featuredCharity.id}`}
                  className="btn-interactive btn-hero-primary"
                >
                  Learn more
                  <span className="btn-hero-icon">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </Link>
                <Link
                  href={`/donate?charity=${featuredCharity.id}`}
                  className="btn-interactive rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Donate now
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center">
            <h2 className="font-display text-3xl font-bold text-brand-green sm:text-4xl">
              This month&apos;s draw
            </h2>
            <p className="mt-3 text-brand-charcoal/70">
              Real numbers. Real prizes. Real community impact.
            </p>
          </ScrollReveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <ScrollReveal delay={0.05}>
              <div className="glass-card text-center">
                <p className="text-sm font-medium text-brand-charcoal/60">Current prize pool</p>
                <p className="prize-pulse mt-3 font-display text-3xl font-bold text-brand-green">
                  <AnimatedCounter value={stats.prize_pool} format={(n) => formatCurrency(n)} />
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <div className="glass-card text-center">
                <p className="text-sm font-medium text-brand-charcoal/60">Active players</p>
                <p className="mt-3 font-display text-3xl font-bold text-brand-green">
                  <AnimatedCounter value={stats.active_players} />
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.15}>
              <div className="glass-card text-center">
                <p className="text-sm font-medium text-brand-charcoal/60">Next draw</p>
                <p className="mt-3 font-display text-2xl font-bold text-brand-green sm:text-3xl">
                  {stats.next_draw_label}
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="bg-white/60 py-20 backdrop-blur-sm sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center">
            <h2 className="font-display text-3xl font-bold text-brand-green sm:text-4xl">
              Stories from our community
            </h2>
          </ScrollReveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((item, index) => (
              <ScrollReveal key={item.name} delay={index * 0.1}>
                <blockquote className="glass-card flex h-full flex-col">
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
        </div>
      </section>

      <section className="relative min-h-[24rem] overflow-hidden py-20 sm:py-28">
        <Image
          src="/images/hero-meadow.jpg"
          alt=""
          fill
          className="object-cover object-top"
          sizes="100vw"
        />
        <div className="hero-meadow-overlay absolute inset-0 bg-brand-green/40" aria-hidden />
        <ScrollReveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-script text-4xl font-semibold text-white sm:text-5xl">
            Ready to play your part?
          </h2>
          <p className="mt-4 text-white/85">
            Join a community where every round supports a cause — and every month brings a
            new chance to win.
          </p>
          <LandingAuthActions initialAuthenticated={initialAuthenticated} variant="footer" />
          <p className="mt-4 text-xs text-white/65">
            Cancel anytime on monthly plans. 14-day money-back guarantee on your first month.
          </p>
        </ScrollReveal>
      </section>
    </>
  );
}
