'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Heart,
  History,
  Home,
  LogOut,
  Menu,
  Settings,
  Target,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Profile, SubscriptionStatus } from '@/types';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, exact: true },
  { href: '/dashboard/scores', label: 'My Scores', icon: Target },
  { href: '/dashboard/draws', label: 'Draw History', icon: History },
  { href: '/dashboard/charity', label: 'My Charity', icon: Heart },
  { href: '/dashboard/account', label: 'Account Settings', icon: Settings },
];

interface DashboardShellProps {
  profile: Pick<Profile, 'full_name' | 'email' | 'subscription_status'>;
  children: React.ReactNode;
}

export function DashboardShell({ profile, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = profile.full_name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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

      <div className="flex">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gray-200 bg-white transition-transform lg:static lg:translate-x-0',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-16 items-center justify-between border-b px-4">
            <Link href="/dashboard" className="text-lg font-bold text-emerald-800">
              Digital Heroes
            </Link>
            <button
              type="button"
              className="rounded-md p-1 lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="space-y-1 p-3">
            {NAV_ITEMS.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                    active
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar overlay"
          />
        )}

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
            <button
              type="button"
              className="rounded-md p-2 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden text-sm text-gray-500 lg:block">
              Welcome back,{' '}
              <span className="font-medium text-gray-900">{profile.full_name}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </button>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-sm font-semibold text-white">
                {initials}
              </div>

              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </form>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function subscriptionStatusLabel(status: SubscriptionStatus): string {
  return status.replace('_', ' ');
}
