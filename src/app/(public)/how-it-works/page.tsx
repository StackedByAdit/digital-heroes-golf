import Link from 'next/link';
import { ScrollReveal } from '@/components/public/ScrollReveal';
import {
  calculatePrizePools,
  DEFAULT_MONTHLY_FEE,
} from '@/lib/drawEngine';
import { formatCurrency } from '@/lib/utils';

const EXAMPLE_SUBSCRIBERS = 120;

const prizeExample = calculatePrizePools({
  subscriberCount: EXAMPLE_SUBSCRIBERS,
  monthlyFeePerUser: DEFAULT_MONTHLY_FEE,
  rolloverAmount: 0,
});

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <ScrollReveal className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-gold">
          Everything you need to know
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-brand-green sm:text-5xl">
          How Digital Heroes works
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-brand-charcoal/70">
          A charity-first golf community where your scores fuel monthly draws and
          meaningful giving — not another traditional club membership.
        </p>
      </ScrollReveal>

      <div className="mt-16 space-y-16">
        <ScrollReveal>
          <Section title="The score system">
            <p>
              We use <strong>Stableford scores</strong> — the points-based format
              most club golfers already play. Log one score per round, and we keep
              your <strong>last five scores</strong> as your rolling draw numbers.
            </p>
            <p className="mt-4">
              Each score must be between 1 and 45 (covering typical Stableford
              ranges). When the monthly draw runs, your five most recent scores are
              matched against the five drawn numbers.
            </p>
          </Section>
        </ScrollReveal>

        <ScrollReveal>
          <Section title="The draw system">
            <p>
              Every month, five numbers are drawn from the pool of all active
              subscriber scores. Numbers can be drawn randomly or algorithmically
              (weighted by how often scores appear in the community).
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              <li>
                <strong>5-number match</strong> — Jackpot winner (40% of the pool)
              </li>
              <li>
                <strong>4-number match</strong> — Share of the 35% four-match pool
              </li>
              <li>
                <strong>3-number match</strong> — Share of the 25% three-match pool
              </li>
            </ul>
            <p className="mt-4">
              If no one hits the jackpot, the 40% rolls over to the next month —
              building excitement and bigger prizes over time.
            </p>
          </Section>
        </ScrollReveal>

        <ScrollReveal>
          <Section title="Prize breakdown">
            <p className="mb-4 text-sm text-brand-charcoal/60">
              Example with {EXAMPLE_SUBSCRIBERS} subscribers at{' '}
              {formatCurrency(DEFAULT_MONTHLY_FEE)}/month (
              {formatCurrency(prizeExample.totalPool)} total pool):
            </p>
            <div className="overflow-hidden rounded-xl border border-brand-green/10">
              <table className="min-w-full text-sm">
                <thead className="bg-brand-green/5">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-brand-green">
                      Match
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-brand-green">
                      Pool share
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-brand-green">
                      Example prize
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-green/10 bg-white">
                  <tr>
                    <td className="px-4 py-3">5-Number</td>
                    <td className="px-4 py-3">40% (Jackpot)</td>
                    <td className="px-4 py-3">
                      {formatCurrency(prizeExample.jackpot)} (rolls over if unclaimed)
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">4-Number</td>
                    <td className="px-4 py-3">35%</td>
                    <td className="px-4 py-3">
                      {formatCurrency(prizeExample.pool4match)} (split among winners)
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">3-Number</td>
                    <td className="px-4 py-3">25%</td>
                    <td className="px-4 py-3">
                      {formatCurrency(prizeExample.pool3match)} (split among winners)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>
        </ScrollReveal>

        <ScrollReveal>
          <Section title="The charity system">
            <p>
              When you subscribe, you choose a partner charity and set your
              contribution from <strong>10% to 100%</strong> of your subscription.
              The remainder funds the prize pool and platform operations.
            </p>
            <p className="mt-4">
              You can change your charity or percentage anytime from your{' '}
              <Link href="/dashboard/charity" className="font-medium text-brand-gold underline">
                dashboard
              </Link>
              . Updates take effect from your next billing cycle.
            </p>
          </Section>
        </ScrollReveal>

        <ScrollReveal>
          <Section title="Winner verification">
            <p>
              If you win a prize, upload a photo of your scorecard showing the
              scores you submitted. Our team verifies within{' '}
              <strong>5 working days</strong>.
            </p>
            <p className="mt-4">
              Once approved, prizes are paid directly to you. If verification fails,
              you can re-upload corrected proof from your dashboard.
            </p>
          </Section>
        </ScrollReveal>
      </div>

      <ScrollReveal className="mt-16 text-center">
        <Link
          href="/pricing"
          className="inline-flex rounded-full bg-brand-gold px-10 py-4 text-sm font-semibold text-brand-charcoal transition hover:bg-brand-gold/90"
        >
          Start Playing
        </Link>
      </ScrollReveal>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl font-bold text-brand-green">{title}</h2>
      <div className="mt-4 space-y-2 text-sm leading-relaxed text-brand-charcoal/80">
        {children}
      </div>
    </section>
  );
}
