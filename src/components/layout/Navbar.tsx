'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LogIn, Menu, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { useNavAuth } from '@/hooks/useNavAuth';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/charities', label: 'Charities' },
  { href: '/donate', label: 'Donate' },
  { href: '/pricing', label: 'Pricing' },
];

type NavbarProps = {
  initialAuthenticated?: boolean;
  initialHasDashboardAccess?: boolean;
  initialIsAdmin?: boolean;
  initialUserName?: string | null;
};

export function Navbar({
  initialAuthenticated = false,
  initialHasDashboardAccess = false,
  initialIsAdmin = false,
  initialUserName = null,
}: NavbarProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isPricing = pathname === '/pricing';
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, hasDashboardAccess, isAdmin } = useNavAuth(
    initialAuthenticated,
    initialHasDashboardAccess || initialIsAdmin,
    initialUserName,
    initialIsAdmin,
  );

  const overlayHero = isHome && !scrolled;
  const pendingSubscription = isAuthenticated && !hasDashboardAccess;
  const navLinks = hasDashboardAccess
    ? NAV_LINKS.filter((link) => link.href !== '/pricing')
    : NAV_LINKS;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const signOutClassName = cn(
    'text-sm font-medium transition',
    overlayHero
      ? 'text-white/80 hover:text-white'
      : 'text-brand-charcoal/70 hover:text-brand-green',
  );

  return (
    <header className="pointer-events-none fixed left-0 right-0 top-0 z-50 px-4 pt-3 sm:px-6">
      <div className="pointer-events-auto mx-auto flex max-w-4xl items-center justify-between gap-2 sm:gap-3">
        <Link
          href="/"
          className={cn(
            'shrink-0 font-display text-lg font-bold sm:text-xl',
            overlayHero ? 'text-white drop-shadow-sm' : 'text-brand-green',
          )}
        >
          Digital Heroes
        </Link>

        <nav
          className={cn(
            'hidden items-center gap-0.5 rounded-full px-1 py-1 lg:flex',
            overlayHero ? 'glass-pill' : 'glass-nav',
          )}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'btn-interactive rounded-full px-3 py-1.5 text-sm font-medium transition sm:px-4 sm:py-2',
                overlayHero
                  ? pathname === link.href
                    ? 'bg-white/20 text-white'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                  : pathname === link.href
                    ? 'bg-brand-green/15 text-brand-green'
                    : 'text-brand-charcoal/80 hover:bg-brand-green/10 hover:text-brand-green',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:gap-3 lg:flex">
          {isAuthenticated && hasDashboardAccess ? (
            <>
              <Link
                href={isAdmin ? '/admin' : '/dashboard'}
                className={cn(
                  'btn-interactive',
                  overlayHero ? 'btn-nav-dashboard-overlay' : 'btn-nav-dashboard',
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                {isAdmin ? 'Admin Panel' : 'Dashboard'}
              </Link>
              <SignOutButton className={signOutClassName} />
            </>
          ) : pendingSubscription ? (
            <>
              {!isPricing && (
                <Link
                  href="/pricing#plans"
                  className={cn(
                    'btn-interactive inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition sm:px-5 sm:py-2.5',
                    overlayHero
                      ? 'glass-pill text-white hover:bg-black/30'
                      : 'bg-brand-green text-white hover:bg-brand-green/90',
                  )}
                >
                  Subscribe
                </Link>
              )}
              <SignOutButton className={signOutClassName} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  'btn-interactive text-sm font-medium transition',
                  overlayHero
                    ? 'text-white/90 hover:text-white'
                    : 'text-brand-charcoal/80 hover:text-brand-green',
                )}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className={cn(
                  'btn-interactive inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition sm:px-5 sm:py-2.5',
                  overlayHero
                    ? 'glass-pill text-white hover:bg-black/30'
                    : 'bg-brand-green text-white hover:bg-brand-green/90',
                )}
              >
                <UserPlus className="h-4 w-4" />
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className={cn(
            'btn-interactive rounded-full p-2 lg:hidden',
            overlayHero ? 'glass-pill text-white' : 'glass-nav text-brand-green',
          )}
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className={cn(
            'pointer-events-auto mx-auto mt-2 max-w-4xl overflow-hidden rounded-2xl px-4 py-4 lg:hidden',
            overlayHero ? 'glass-panel-dark' : 'glass-nav',
          )}
        >
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'btn-interactive rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  overlayHero
                    ? pathname === link.href
                      ? 'bg-white/15 text-white'
                      : 'text-white/90 hover:bg-white/10'
                    : pathname === link.href
                      ? 'bg-brand-green/15 text-brand-green'
                      : 'text-brand-charcoal hover:bg-brand-green/10',
                )}
              >
                {link.label}
              </Link>
            ))}
            <div
              className={cn(
                'mt-3 flex flex-col gap-2 border-t pt-4',
                overlayHero ? 'border-white/15' : 'border-brand-green/10',
              )}
            >
              {isAuthenticated && hasDashboardAccess ? (
                <>
                  <Link
                    href={isAdmin ? '/admin' : '/dashboard'}
                    className={cn(
                      'btn-interactive rounded-full px-4 py-2.5 text-center text-sm font-semibold',
                      overlayHero
                        ? 'btn-nav-dashboard-overlay justify-center'
                        : 'btn-nav-dashboard justify-center',
                    )}
                  >
                    {isAdmin ? 'Admin Panel' : 'Dashboard'}
                  </Link>
                  <SignOutButton
                    className={cn(
                      'justify-center rounded-full px-4 py-2.5 text-sm font-medium',
                      overlayHero
                        ? 'text-white/90 hover:bg-white/10'
                        : 'text-brand-charcoal hover:bg-brand-green/10',
                    )}
                  />
                </>
              ) : pendingSubscription ? (
                <>
                  {!isPricing && (
                    <Link
                      href="/pricing#plans"
                      className={cn(
                        'btn-interactive rounded-full px-4 py-2.5 text-center text-sm font-semibold',
                        overlayHero
                          ? 'bg-white/20 text-white'
                          : 'bg-brand-green text-white',
                      )}
                    >
                      Subscribe
                    </Link>
                  )}
                  <SignOutButton
                    className={cn(
                      'justify-center rounded-full px-4 py-2.5 text-sm font-medium',
                      overlayHero
                        ? 'text-white/90 hover:bg-white/10'
                        : 'text-brand-charcoal hover:bg-brand-green/10',
                    )}
                  />
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={cn(
                      'btn-interactive inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium',
                      overlayHero
                        ? 'text-white/90 hover:bg-white/10'
                        : 'text-brand-charcoal hover:bg-brand-green/10',
                    )}
                  >
                    <LogIn className="h-4 w-4" />
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className={cn(
                      'btn-interactive rounded-full px-4 py-2.5 text-center text-sm font-semibold',
                      overlayHero
                        ? 'glass-pill text-white'
                        : 'bg-brand-green text-white',
                    )}
                  >
                    Get started
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
