'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LogIn, Menu, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/charities', label: 'Charities' },
  { href: '/donate', label: 'Donate' },
  { href: '/pricing', label: 'Pricing' },
];

type NavbarProps = {
  initialAuthenticated?: boolean;
};

export function Navbar({ initialAuthenticated = false }: NavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useAuthSession(initialAuthenticated);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-brand-green/10 bg-brand-cream/85 shadow-sm backdrop-blur-md'
          : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-display text-xl font-bold text-brand-green sm:text-2xl">
          Digital Heroes
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-active={pathname === link.href ? 'true' : 'false'}
              className={cn(
                'nav-link-underline btn-interactive text-sm font-medium transition hover:text-brand-gold',
                pathname === link.href ? 'text-brand-gold' : 'text-brand-charcoal/80',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="btn-interactive btn-cta inline-flex items-center gap-2 rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-green/90"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="btn-interactive inline-flex items-center gap-2 rounded-full border border-brand-green/25 px-4 py-2 text-sm font-medium text-brand-green transition hover:border-brand-green hover:bg-brand-green/5"
              >
                <LogIn className="h-4 w-4" />
                Log in
              </Link>
              <Link
                href="/signup"
                className="btn-interactive btn-cta inline-flex items-center gap-2 rounded-full bg-brand-gold px-5 py-2.5 text-sm font-semibold text-brand-charcoal transition hover:bg-brand-gold/90"
              >
                <UserPlus className="h-4 w-4" />
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="btn-interactive rounded-md p-2 text-brand-green md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-brand-green/10 bg-brand-cream px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'btn-interactive rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  pathname === link.href
                    ? 'bg-brand-green/10 text-brand-gold'
                    : 'text-brand-charcoal hover:bg-brand-green/5',
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-brand-green/10 pt-4">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="btn-interactive btn-cta rounded-full bg-brand-green px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="btn-interactive rounded-full border border-brand-green/25 px-4 py-2.5 text-center text-sm font-medium text-brand-green"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="btn-interactive btn-cta rounded-full bg-brand-gold px-4 py-2.5 text-center text-sm font-semibold text-brand-charcoal"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
