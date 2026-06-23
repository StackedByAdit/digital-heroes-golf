import { Resend } from 'resend';

let resendClient: Resend | undefined;

export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

/** Resend SDK instance (lazy). Use getResendClient() when the key may be unset. */
export const resend = {
  get emails() {
    const client = getResendClient();
    if (!client) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    return client.emails;
  },
};

export const DEFAULT_FROM_EMAIL =
  process.env.EMAIL_FROM ?? 'Digital Heroes <onboarding@resend.dev>';
