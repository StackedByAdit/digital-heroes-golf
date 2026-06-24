import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <header className="px-6 py-6">
        <Link
          href="/"
          className="font-display text-2xl font-bold text-brand-green"
        >
          Digital Heroes
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        {children}
      </main>
    </div>
  );
}
