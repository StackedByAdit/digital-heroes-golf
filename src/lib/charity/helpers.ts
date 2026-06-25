export const SUBSCRIPTION_MONTHLY_GBP = 10;
export const SUBSCRIPTION_YEARLY_GBP = 100;

export function calculateCharityContribution(
  plan: 'monthly' | 'yearly' | null,
  percentage: number
): number {
  const monthlyBase =
    plan === 'yearly'
      ? SUBSCRIPTION_YEARLY_GBP / 12
      : SUBSCRIPTION_MONTHLY_GBP;

  return Math.round(((monthlyBase * percentage) / 100) * 100) / 100;
}

export function excerpt(text: string, maxLength = 120): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

export const FAIRWAY_FUTURES_CHARITY_ID =
  'a0000002-0000-4000-8000-000000000002';

export function charityDisplayImage(
  charity: { id: string; image_url: string | null },
  variant: 'featured' | 'card' = 'card',
): string | null {
  if (
    variant === 'featured' &&
    charity.id === FAIRWAY_FUTURES_CHARITY_ID
  ) {
    return '/images/charities/fairway-futures-featured.jpg';
  }

  return charity.image_url;
}

export function pickFeaturedCharity<T extends { id: string; is_featured: boolean }>(
  charities: T[],
): T | null {
  return (
    charities.find(
      (charity) =>
        charity.id === FAIRWAY_FUTURES_CHARITY_ID && charity.is_featured,
    ) ??
    charities.find((charity) => charity.is_featured) ??
    null
  );
}
