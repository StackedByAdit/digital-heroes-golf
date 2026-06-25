import { cn } from '@/lib/utils';

const STEPS = ['Account', 'Charity', 'Plan'] as const;

type AuthStepperProps = {
  step: 1 | 2 | 3;
};

export function AuthStepper({ step }: AuthStepperProps) {
  return (
    <div className="mx-auto w-full max-w-md px-4 pb-6 sm:pb-8">
      <div className="rounded-2xl border border-white/15 bg-black/45 px-5 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-md">
        <div className="flex justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] sm:text-[11px] sm:tracking-[0.22em]">
          {STEPS.map((label, index) => (
            <span
              key={label}
              className={cn(
                'drop-shadow-sm transition-colors',
                step >= index + 1 ? 'text-brand-gold' : 'text-white/90',
              )}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="relative mt-3 h-0.5 bg-white/30">
          <div
            className="absolute inset-y-0 left-0 bg-brand-gold transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
        <p className="mt-3 text-center text-sm font-medium text-white drop-shadow-sm">
          Step {step} of 3
        </p>
      </div>
    </div>
  );
}
