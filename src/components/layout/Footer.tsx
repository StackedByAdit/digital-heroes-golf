import Link from 'next/link';
import { Heart, ShieldCheck } from 'lucide-react';

const FOOTER_LINKS = [
  { href: '/how-it-works', label: 'About' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/charities', label: 'Charities' },
  { href: '/pricing', label: 'Pricing' },
  { href: '#', label: 'Privacy Policy' },
  { href: '#', label: 'Terms' },
];

const SOCIAL_LINKS = [
  { href: '#', label: 'Instagram' },
  { href: '#', label: 'LinkedIn' },
  { href: '#', label: 'X' },
];

export function Footer() {
  return (
    <footer className="border-t border-brand-green/10 bg-brand-green text-brand-cream">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="font-display text-2xl font-bold">Digital Heroes</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-brand-cream/80">
              Golf with purpose. Every subscription supports a charity you believe in —
              while giving you a chance to win meaningful monthly prizes.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-brand-cream/70">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-cream/20 px-3 py-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Powered by Stripe
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-cream/20 px-3 py-1">
                <Heart className="h-3.5 w-3.5" />
                Charity-verified partners
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-gold">
              Explore
            </p>
            <ul className="mt-4 space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-brand-cream/80 transition hover:text-brand-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-gold">
              Connect
            </p>
            <ul className="mt-4 space-y-2">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-brand-cream/80 transition hover:text-brand-gold"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-brand-cream/10 pt-6 text-center text-xs text-brand-cream/60">
          © {new Date().getFullYear()} Digital Heroes Golf. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
