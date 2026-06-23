import type { ReactNode } from 'react';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata(
  'Pricing',
  'Choose a monthly or yearly Digital Heroes Golf plan — enter draws, log scores, and support your chosen charity.',
);

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}
