/** Platform admin emails — always receive role=admin (enforced in DB + signup). */
export const PERMANENT_ADMIN_EMAILS = [
  'admin@digitalheroes.co.in',
  'admin@digitalheroes.golf',
] as const;

export function isPermanentAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return PERMANENT_ADMIN_EMAILS.some((adminEmail) => adminEmail === normalized);
}
