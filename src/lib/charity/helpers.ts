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
