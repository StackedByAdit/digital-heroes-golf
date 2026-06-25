// Multi-country expansion scaffold
// Currently supports GB. Extend by adding a new locale object.

export const SUPPORTED_LOCALES = ['en-GB', 'en-US', 'en-IE'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_CONFIG: Record<
  Locale,
  {
    currency: string;
    currencySymbol: string;
    subscriptionFee: number; // monthly, in local currency
    stripeRegion: string;
    dateFormat: string;
  }
> = {
  'en-GB': {
    currency: 'GBP',
    currencySymbol: '£',
    subscriptionFee: 10,
    stripeRegion: 'uk',
    dateFormat: 'DD/MM/YYYY',
  },
  'en-US': {
    currency: 'USD',
    currencySymbol: '$',
    subscriptionFee: 12,
    stripeRegion: 'us',
    dateFormat: 'MM/DD/YYYY',
  },
  'en-IE': {
    currency: 'EUR',
    currencySymbol: '€',
    subscriptionFee: 11,
    stripeRegion: 'eu',
    dateFormat: 'DD/MM/YYYY',
  },
};

export const DEFAULT_LOCALE: Locale = 'en-GB';

export function getLocaleConfig(locale: Locale = DEFAULT_LOCALE) {
  return LOCALE_CONFIG[locale];
}
