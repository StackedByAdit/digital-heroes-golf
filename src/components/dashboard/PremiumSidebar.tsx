'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export type SidebarSection = {
  title?: string;
  items: SidebarNavItem[];
};

interface PremiumSidebarProps {
  brandHref: string;
  sections: SidebarSection[];
  footer: {
    name: string;
    badge: string;
    initials?: string;
  };
  footerExtra?: React.ReactNode;
  onNavigate?: () => void;
  className?: string;
}

export function PremiumSidebar({
  brandHref,
  sections,
  footer,
  footerExtra,
  onNavigate,
  className,
}: PremiumSidebarProps) {
  const pathname = usePathname();

  function isActive(item: SidebarNavItem) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  return (
    <aside
      className={cn(
        'dashboard-sidebar relative flex h-screen w-[17.5rem] shrink-0 flex-col overflow-hidden lg:w-72',
        className,
      )}
    >
      <Image
        src="/images/auth-golf-course.jpg"
        alt=""
        fill
        priority
        className="object-cover object-[center_40%] scale-105"
        sizes="288px"
      />
      <div className="dashboard-sidebar-overlay absolute inset-0" aria-hidden />

      <div className="relative z-10 flex h-full flex-col px-7 py-8">
        <div className="shrink-0">
          <Link
            href={brandHref}
            onClick={onNavigate}
            className="group block"
          >
            <span className="font-display text-[1.65rem] font-semibold leading-tight tracking-tight text-white transition group-hover:text-white/90">
              Digital Heroes
            </span>
            <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.28em] text-white/45">
              Golf for Good
            </span>
          </Link>
        </div>

        <nav className="mt-10 flex-1 space-y-8 overflow-hidden">
          {sections.map((section, index) => (
            <div key={section.title ?? `section-${index}`}>
              {section.title && (
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
                  {section.title}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item);
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        data-active={active ? 'true' : 'false'}
                        className={cn(
                          'dashboard-sidebar-link group flex items-center gap-3 py-2.5 text-[0.9375rem] font-medium transition-colors duration-200',
                          active
                            ? 'text-white'
                            : 'text-white/55 hover:text-white/85',
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-[18px] w-[18px] shrink-0 stroke-[1.5]',
                            active ? 'text-white' : 'text-white/50 group-hover:text-white/75',
                          )}
                        />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-auto shrink-0 space-y-3 pt-6">
          {footerExtra}
          <div className="dashboard-sidebar-profile flex items-center gap-3 rounded-xl border border-white/15 bg-black/20 px-4 py-3.5 backdrop-blur-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/5">
              {footer.initials ? (
                <span className="text-xs font-semibold text-white/90">
                  {footer.initials}
                </span>
              ) : (
                <User className="h-4 w-4 text-white/70" strokeWidth={1.5} />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {footer.name}
              </p>
              <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                {footer.badge}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
