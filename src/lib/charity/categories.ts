import type { CharityCategory } from '@/types';

export const CHARITY_CATEGORIES: {
  value: CharityCategory;
  label: string;
}[] = [
  { value: 'health', label: 'Health & Medical' },
  { value: 'mental_health', label: 'Mental Health' },
  { value: 'environment', label: 'Environment' },
  { value: 'community', label: 'Community' },
  { value: 'education', label: 'Education' },
  { value: 'animals', label: 'Animals & Wildlife' },
  { value: 'veterans', label: 'Veterans & Forces' },
  { value: 'youth', label: 'Youth & Sport' },
];

export function charityCategoryLabel(category: CharityCategory | string): string {
  return CHARITY_CATEGORIES.find((item) => item.value === category)?.label ?? category;
}
