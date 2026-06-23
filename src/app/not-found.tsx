import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-cream px-4 text-center">
      <p className="text-6xl font-display font-bold text-brand-gold">404</p>
      <h1 className="mt-4 font-display text-3xl font-bold text-brand-green sm:text-4xl">
        Looks like this shot went out of bounds
      </h1>
      <p className="mt-4 max-w-md text-brand-charcoal/70">
        The page you&apos;re looking for doesn&apos;t exist — maybe a bad lie, maybe
        a wrong turn on the fairway. Let&apos;s get you back in play.
      </p>
      <Link
        href="/"
        className="btn-interactive btn-cta mt-8 inline-flex rounded-full bg-brand-gold px-8 py-3.5 text-sm font-semibold text-brand-charcoal transition hover:bg-brand-gold/90"
      >
        Back to the clubhouse
      </Link>
    </div>
  );
}
