'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Award,
  Gift,
  LayoutDashboard,
  LogOut,
  Menu,
  Trophy,
  Users,
  X,
  Home,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/draws', label: 'Draws', icon: Trophy },
  { href: '/admin/charities', label: 'Charities', icon: Gift },
  { href: '/admin/winners', label: 'Winners', icon: Award },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

interface AdminShellProps {
  adminName: string;
  children: React.ReactNode;
}

export function AdminShell({ adminName, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-64 transform border-r border-red-200 bg-white transition-transform lg:static lg:translate-x-0',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="border-b border-red-100 bg-red-50 px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                  Admin
                </span>
                <p className="mt-2 text-lg font-bold text-gray-900">Digital Heroes</p>
              </div>
              <button
                type="button"
                className="rounded-md p-1 lg:hidden"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
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
                      ? 'bg-red-50 text-red-800'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-red-100 p-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              <Home className="h-4 w-4" />
              Member Dashboard
            </Link>
          </div>
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
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-red-100 bg-white px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-md p-2 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-sm font-semibold text-red-700">Admin Panel</p>
                <p className="text-xs text-gray-500">{adminName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-green/25 bg-brand-green/5 px-3 py-1.5 text-sm font-medium text-brand-green hover:bg-brand-green/10"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Member Dashboard</span>
              </Link>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
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
