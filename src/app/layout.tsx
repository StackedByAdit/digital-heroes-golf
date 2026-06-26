import type { Metadata, Viewport } from 'next';
import { Caveat, Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from 'sonner';
import { rootMetadata } from '@/lib/seo/metadata';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  style: ['normal', 'italic'],
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
});

export const metadata: Metadata = rootMetadata;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1a3c2e',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} ${caveat.variable} font-sans antialiased`}
      >
        {children}
        <Toaster
          richColors
          closeButton
          position="bottom-right"
          theme="dark"
          toastOptions={{
            classNames: {
              toast: 'border border-brand-gold/20 bg-brand-green text-brand-cream',
              title: 'text-brand-cream',
              description: 'text-brand-cream/80',
            },
          }}
        />
      </body>
    </html>
  );
}
