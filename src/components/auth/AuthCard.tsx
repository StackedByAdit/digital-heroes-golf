import { cn } from '@/lib/utils';

type AuthCardProps = {
  children: React.ReactNode;
  className?: string;
  size?: 'md' | 'lg';
};

export function AuthCard({ children, className, size = 'md' }: AuthCardProps) {
  return (
    <div
      className={cn(
        'w-full rounded-2xl border border-brand-gold/45 bg-white p-6 shadow-[0_24px_64px_rgba(26,60,46,0.18)] sm:p-8',
        size === 'md' && 'max-w-md',
        size === 'lg' && 'max-w-2xl',
        className,
      )}
    >
      {children}
    </div>
  );
}
