'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, ShieldCheck, Heart, HelpCircle } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import {
  SUBSCRIPTION_MONTHLY_GBP,
  SUBSCRIPTION_YEARLY_GBP,
  calculateCharityContribution,
} from '@/lib/charity/helpers';
import { formatCurrency } from '@/lib/utils';

const FEATURES = [
  'Monthly prize draws based on your golf scores',
  'Choose any partner charity and set your gift from 10%',
  'Track scores, draws, and winnings in your dashboard',
  'Verified winner payouts with transparent prize pools',
  'Change charity or contribution anytime',
];

const FAQ = [
  {
    q: 'How do the monthly draws work?',
    a: 'Each month we draw five numbers from the active subscriber score pool. Your last five logged Stableford scores are your entries. Match 3, 4, or 5 numbers to win from the prize pool.',
  },
  {
    q: 'Can I change my charity?',
    a: 'Yes — update your chosen charity and contribution percentage anytime from your dashboard. Changes apply from your next billing cycle.',
  },
  {
    q: 'What happens if I cancel?',
    a: 'Monthly subscribers can cancel anytime. You retain dashboard access until the end of your billing period, then your draw entries pause until you resubscribe.',
  },
  {
    q: 'How are winners verified?',
    a: 'Winners upload proof of their submitted scores (scorecard photo). Our team reviews within 5 working days before prizes are paid.',
  },
  {
    q: 'Is my payment secure?',
    a: 'All subscriptions are processed securely through Stripe. We never store your card details on our servers.',
  },
];

export default function PricingPage() {
  const [demoPercentage, setDemoPercentage] = useState(25);

  const monthlyContribution = calculateCharityContribution('monthly', demoPercentage);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <ScrollReveal className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-gold">
          Simple, transparent pricing
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-brand-green sm:text-5xl">
          Play for purpose
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-brand-charcoal/70">
          One subscription. Monthly draws. A charity you believe in. Choose the
          billing that suits you.
        </p>
      </ScrollReveal>

      <div className="mt-14 grid gap-8 lg:grid-cols-2">
        <ScrollReveal delay={0.05}>
          <PlanCard
            name="Monthly"
            price={SUBSCRIPTION_MONTHLY_GBP}
            period="month"
            ctaHref="/signup?plan=monthly"
            badge={null}
          />
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <PlanCard
            name="Yearly"
            price={SUBSCRIPTION_YEARLY_GBP}
            period="year"
            ctaHref="/signup?plan=yearly"
            badge="Save £20"
          />
        </ScrollReveal>
      </div>

      <ScrollReveal className="mt-20 rounded-2xl border border-brand-green/10 bg-white p-8 shadow-sm">
        <h2 className="font-display text-2xl font-bold text-brand-green">
          Your subscription, your impact
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-charcoal/70">
          Minimum 10% of your subscription goes to your chosen charity. You choose
          how much — from 10% all the way to 100%.
        </p>

        <div className="mt-8 max-w-xl">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-brand-green">Charity contribution</span>
            <span className="font-semibold text-brand-gold">{demoPercentage}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={demoPercentage}
            onChange={(event) => setDemoPercentage(Number(event.target.value))}
            className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-brand-green/15 accent-brand-gold"
          />
          <div className="mt-2 flex justify-between text-xs text-brand-charcoal/50">
            <span>10%</span>
            <span>100%</span>
          </div>
          <p className="mt-4 text-sm text-brand-charcoal/70">
            At {demoPercentage}% on the monthly plan, that&apos;s{' '}
            <strong className="text-brand-green">
              {formatCurrency(monthlyContribution)}
            </strong>{' '}
            to your charity every month.
          </p>
        </div>
      </ScrollReveal>

      <section className="mt-20">
        <ScrollReveal>
          <h2 className="font-display text-2xl font-bold text-brand-green">
            Frequently asked questions
          </h2>
        </ScrollReveal>
        <div className="mt-8 space-y-4">
          {FAQ.map((item, index) => (
            <ScrollReveal key={item.q} delay={index * 0.05}>
              <details className="group rounded-xl border border-brand-green/10 bg-white p-6 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-brand-green">
                  {item.q}
                  <HelpCircle className="h-4 w-4 text-brand-gold transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-brand-charcoal/70">
                  {item.a}
                </p>
              </details>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <ScrollReveal className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-brand-charcoal/60">
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand-gold" />
          Stripe-secured payments
        </span>
        <span className="inline-flex items-center gap-2">
          <Heart className="h-4 w-4 text-brand-gold" />
          Charity-verified partners
        </span>
        <span className="inline-flex items-center gap-2">
          <Check className="h-4 w-4 text-brand-gold" />
          Cancel anytime (monthly)
        </span>
      </ScrollReveal>
    </div>
  );
}

function PlanCard({
  name,
  price,
  period,
  ctaHref,
  badge,
}: {
  name: string;
  price: number;
  period: string;
  ctaHref: string;
  badge: string | null;
}) {
  return (
    <div className="relative flex h-full flex-col rounded-2xl border border-brand-green/10 bg-white p-8 shadow-sm transition dashboard-card">
      {badge && (
        <span className="absolute -top-3 right-6 rounded-full bg-brand-gold px-3 py-1 text-xs font-bold text-brand-charcoal">
          {badge}
        </span>
      )}
      <h2 className="font-display text-2xl font-bold text-brand-green">{name} Plan</h2>
      <p className="mt-4">
        <span className="font-display text-4xl font-bold text-brand-charcoal">
          {formatCurrency(price)}
        </span>
        <span className="text-brand-charcoal/60">/{period}</span>
      </p>
      {name === 'Monthly' && (
        <p className="mt-1 text-sm text-brand-charcoal/50">Cancel anytime</p>
      )}
      <ul className="mt-8 flex-1 space-y-3">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-brand-charcoal/80">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className="btn-interactive btn-cta mt-8 block rounded-full bg-brand-green py-3.5 text-center text-sm font-semibold text-white transition hover:bg-brand-green/90"
      >
        Get Started
      </Link>
    </div>
  );
}
