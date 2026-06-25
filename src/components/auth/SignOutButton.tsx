'use client';

import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

type SignOutButtonProps = {
  className?: string;
  showIcon?: boolean;
  label?: string;
};

export function SignOutButton({
  className,
  showIcon = true,
  label = 'Log out',
}: SignOutButtonProps) {
  return (
    <form action="/api/auth/signout" method="post" className="inline-flex">
      <button
        type="submit"
        className={cn('btn-interactive inline-flex items-center gap-1.5', className)}
      >
        {showIcon && <LogOut className="h-4 w-4" />}
        {label}
      </button>
    </form>
  );
}
