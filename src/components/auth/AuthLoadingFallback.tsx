import { AuthShell } from '@/components/auth/AuthShell';

export function AuthLoadingFallback() {
  return (
    <AuthShell>
      <p className="text-sm text-white/80">Loading…</p>
    </AuthShell>
  );
}
