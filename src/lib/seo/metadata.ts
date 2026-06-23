import type { Metadata } from 'next';

export const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://digitalheroes.golf';

const defaultDescription =
  'Play golf, win monthly prizes, and support your favourite charity.';

export const rootMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Digital Heroes Golf',
    template: '%s | Digital Heroes Golf',
  },
  description: defaultDescription,
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: siteUrl,
    siteName: 'Digital Heroes Golf',
    title: 'Digital Heroes Golf',
    description: defaultDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Digital Heroes Golf',
    description: defaultDescription,
  },
};

export function createPageMetadata(
  title: string,
  description: string,
): Metadata {
  const fullTitle = `${title} | Digital Heroes Golf`;

  return {
    title,
    description,
    openGraph: {
      title: fullTitle,
      description,
      url: siteUrl,
    },
    twitter: {
      title: fullTitle,
      description,
    },
  };
}
