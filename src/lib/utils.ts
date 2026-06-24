import { format, formatDistanceToNow } from 'date-fns';

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

const CURRENCY_LOCALE: Record<string, string> = {
  GBP: 'en-GB',
  USD: 'en-US',
  EUR: 'de-DE',
};

export function formatCurrency(amount: number, currency = 'GBP') {
  const locale = CURRENCY_LOCALE[currency] ?? 'en-GB';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date: string) {
  return format(new Date(date), 'd MMMM yyyy');
}

export function formatRelativeTime(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getMonthKey(date: Date = new Date()) {
  return format(date, 'yyyy-MM');
}

export { calculatePrizePools } from '@/lib/drawEngine';
