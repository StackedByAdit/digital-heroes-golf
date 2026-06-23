'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Heart,
  History,
  Home,
  LogOut,
  Settings,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile, SubscriptionStatus } from '@/types';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Home, exact: true },
  { href: '/dashboard/scores', label: 'My Scores', shortLabel: 'Scores', icon: Target },
  { href: '/dashboard/draws', label: 'Draw History', shortLabel: 'Draws', icon: History },
  { href: '/dashboard/charity', label: 'My Charity', shortLabel: 'Charity', icon: Heart },
  { href: '/dashboard/account', label: 'Account Settings', shortLabel: 'Account', icon: Settings },
];

interface DashboardShellProps {
  profile: Pick<Profile, 'full_name' | 'email' | 'subscription_status'>;
  children: React.ReactNode;
}

export function DashboardShell({ profile, children }: DashboardShellProps) {
  const pathname = usePathname();

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
    <div className="min-h-screen bg-gray-50">
      {profile.subscription_status !== 'active' && (
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

      <div className="flex w-full">
        <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:block">
          <div className="flex h-16 items-center border-b px-4">
            <Link href="/dashboard" className="text-lg font-bold text-brand-green">
              Digital Heroes
            </Link>
          </div>
          <nav className="space-y-1 p-3">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'btn-interactive flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                    active
                      ? 'bg-brand-green/10 text-brand-green'
                      : 'text-gray-700 hover:bg-gray-100',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 sm:h-16 lg:px-6">
            <div className="min-w-0">
              <Link href="/dashboard" className="text-base font-bold text-brand-green lg:hidden">
                Digital Heroes
              </Link>
              <p className="hidden truncate text-sm text-gray-500 lg:block">
                Welcome back,{' '}
                <span className="font-medium text-gray-900">{profile.full_name}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="btn-interactive rounded-full p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </button>

              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green text-xs font-semibold text-white sm:h-9 sm:w-9 sm:text-sm">
                {initials}
              </div>

              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="btn-interactive inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:px-3"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </form>
            </div>
          </header>

          <main className="flex-1 p-4 pb-20 lg:p-6 lg:pb-6">{children}</main>
        </div>
      </div>

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
