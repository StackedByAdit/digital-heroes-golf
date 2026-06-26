'use client';

import {
  BarChart3,
  Award,
  Gift,
  LayoutDashboard,
  LogOut,
  Menu,
  Trophy,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import {
  PremiumSidebar,
  type SidebarSection,
} from '@/components/dashboard/PremiumSidebar';
import { cn } from '@/lib/utils';

const NAV_SECTIONS: SidebarSection[] = [
  {
    title: 'Administration',
    items: [
      { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/draws', label: 'Draws', icon: Trophy },
      { href: '/admin/charities', label: 'Charities', icon: Gift },
      { href: '/admin/winners', label: 'Winners', icon: Award },
      { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
];

interface AdminShellProps {
  adminName: string;
  children: React.ReactNode;
}

export function AdminShell({ adminName, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = adminName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-brand-cream">
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <PremiumSidebar
          brandHref="/"
          sections={NAV_SECTIONS}
          footer={{
            name: adminName,
            badge: 'Administrator',
            initials,
          }}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      <div className="flex min-h-screen flex-col lg:pl-72">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-brand-green/10 bg-brand-cream/95 px-4 backdrop-blur-sm sm:h-16 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md p-2 text-brand-green lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="font-display text-sm font-semibold text-brand-green sm:text-base">
                Admin Panel
              </p>
              <p className="text-xs text-gray-500">{adminName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="btn-interactive inline-flex items-center gap-1 rounded-lg border border-brand-green/15 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-white/60 sm:px-3"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
