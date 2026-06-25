import Image from 'next/image';
import Link from 'next/link';

type AuthShellProps = {
  children: React.ReactNode;
  beforeMain?: React.ReactNode;
};

export function AuthShell({ children, beforeMain }: AuthShellProps) {
  return (
    <div className="relative h-screen overflow-hidden">
      <Image
        src="/images/auth-golf-course.jpg"
        alt=""
        fill
        priority
        className="object-cover object-center scale-[1.02] blur-[2px]"
        sizes="100vw"
      />
      <div className="auth-scene-overlay absolute inset-0" aria-hidden />
      <div className="relative z-10 flex h-full flex-col overflow-hidden">
        <header className="px-5 py-5 sm:px-8 sm:py-6">
          <Link
            href="/"
            className="font-display text-xl font-bold text-white drop-shadow-sm sm:text-2xl"
          >
            Digital Heroes
          </Link>
        </header>

        {beforeMain}

        <main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-4 pb-8 pt-2 sm:px-6 sm:pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
