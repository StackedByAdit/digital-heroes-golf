import { format } from 'date-fns';

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

export function getMonthKey(date: Date = new Date()) {
  return format(date, 'yyyy-MM');
}

export function calculatePrizePools(
  subscriberCount: number,
  feePerSubscriber: number,
  rollover: number
) {
  const total = subscriberCount * feePerSubscriber + rollover;

  return {
    jackpot: total * 0.4,
    pool4match: total * 0.35,
    pool3match: total * 0.25,
  };
}
