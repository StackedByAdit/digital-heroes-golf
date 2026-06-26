'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { usePathname } from 'next/navigation';
import {
  Heart,
  History,
  Home,
  LogOut,
  Settings,
  Shield,
  Target,
} from 'lucide-react';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import {
  PremiumSidebar,
  type SidebarSection,
} from '@/components/dashboard/PremiumSidebar';
import { hasPlatformAccess } from '@/lib/subscription/access';
import type { Profile, SubscriptionStatus } from '@/types';

const NAV_SECTIONS: SidebarSection[] = [
  {
    title: 'Navigation',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: Home, exact: true },
      { href: '/dashboard/scores', label: 'My Scores', icon: Target },
      { href: '/dashboard/draws', label: 'Draw History', icon: History },
      { href: '/dashboard/charity', label: 'My Charity', icon: Heart },
    ],
  },
  {
    title: 'Member Actions',
    items: [
      { href: '/dashboard/account', label: 'Account Settings', icon: Settings },
    ],
  },
];

const NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items).map((item) => ({
  ...item,
  shortLabel:
    item.label === 'Dashboard'
      ? 'Home'
      : item.label === 'My Scores'
        ? 'Scores'
        : item.label === 'Draw History'
          ? 'Draws'
          : item.label === 'My Charity'
            ? 'Charity'
            : 'Account',
}));

interface DashboardShellProps {
  profile: Pick<
    Profile,
    'full_name' | 'email' | 'subscription_status' | 'subscription_ends_at' | 'role'
  >;
  children: React.ReactNode;
}

function memberBadge(
  status: SubscriptionStatus,
  hasAccess: boolean,
  role: Profile['role'],
): string {
  if (role === 'admin') return 'Administrator';
  if (!hasAccess) return 'Guest Member';
  if (status === 'active') return 'Active Member';
  if (status === 'past_due') return 'Active Member';
  if (status === 'cancelled') return 'Member';
  return 'Member';
}

export function DashboardShell({ profile, children }: DashboardShellProps) {
  const pathname = usePathname();
  const platformAccess = hasPlatformAccess(
    profile.subscription_status,
    profile.subscription_ends_at,
  );

  const initials = profile.full_name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function isActive(item: (typeof NAV_ITEMS)[number]) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block">
        <PremiumSidebar
          brandHref="/"
          sections={NAV_SECTIONS}
          footer={{
            name: profile.full_name,
            badge: memberBadge(
              profile.subscription_status,
              platformAccess,
              profile.role,
            ),
            initials,
          }}
          footerExtra={
            profile.role === 'admin' ? (
              <Link
                href="/admin"
                className="btn-interactive flex items-center gap-3 rounded-xl border border-brand-gold/30 bg-brand-gold/10 px-4 py-3 text-sm font-medium text-brand-gold transition hover:bg-brand-gold/15"
              >
                <Shield className="h-4 w-4" strokeWidth={1.5} />
                Admin Panel
              </Link>
            ) : undefined
          }
        />
      </div>

      <div className="flex min-h-screen flex-col lg:pl-72">
        {!platformAccess && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Your subscription is{' '}
            <span className="font-semibold capitalize">
              {profile.subscription_status.replace('_', ' ')}
            </span>
            .{' '}
            <Link href="/pricing" className="font-semibold underline">
              Subscribe to enter draws and manage scores
            </Link>
          </div>
        )}

        {platformAccess && profile.subscription_status === 'past_due' && (
          <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            Your last payment failed.{' '}
            <Link href="/dashboard/account" className="font-semibold underline">
              Update billing details
            </Link>{' '}
            to avoid losing access.
          </div>
        )}

        {platformAccess && profile.subscription_status === 'cancelled' && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Your subscription is cancelled
            {profile.subscription_ends_at
              ? ` — access continues until ${format(new Date(profile.subscription_ends_at), 'd MMMM yyyy')}`
              : ''}
            .
          </div>
        )}

        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-brand-green/10 bg-brand-cream/95 px-4 backdrop-blur-sm sm:h-16 lg:px-8">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">
              {profile.full_name}&apos;s dashboard
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {profile.role === 'admin' && (
              <Link
                href="/admin"
                className="btn-interactive inline-flex items-center gap-1.5 rounded-lg border border-brand-gold/30 bg-brand-gold/10 px-2.5 py-1.5 text-sm font-semibold text-brand-green transition hover:bg-brand-gold/15 sm:px-3"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Admin Panel</span>
                <span className="sm:hidden">Admin</span>
              </Link>
            )}

            <NotificationBell />

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green text-xs font-semibold text-white sm:h-9 sm:w-9 sm:text-sm">
              {initials}
            </div>

            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="btn-interactive inline-flex items-center gap-1 rounded-lg border border-brand-green/15 px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-white/60 sm:px-3"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-4 pb-20 lg:p-8 lg:pb-8">{children}</main>
      </div>

      {profile.role === 'admin' && (
        <div className="border-b border-brand-gold/20 bg-brand-gold/10 px-4 py-2.5 lg:hidden">
          <Link
            href="/admin"
            className="btn-interactive inline-flex items-center gap-2 text-sm font-semibold text-brand-green"
          >
            <Shield className="h-4 w-4" />
            Open Admin Panel
          </Link>
        </div>
      )}

      <nav className="mobile-tab-bar lg:hidden" aria-label="Dashboard navigation">
        <div className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={active ? 'true' : 'false'}
                className="mobile-tab-link btn-interactive"
              >
                <Icon className="h-5 w-5" />
                <span>{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function subscriptionStatusLabel(status: SubscriptionStatus): string {
  return status.replace('_', ' ');
}
