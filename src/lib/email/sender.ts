import { DEFAULT_FROM_EMAIL, getResendClient } from '@/lib/email/client';

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.warn(
        '[email] RESEND_API_KEY is not set — emails will not be sent. Add it to .env.local for production.',
        { to: params.to, subject: params.subject }
      );
      return { success: false, error: 'Email provider not configured' };
    }

    const { error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error('[email] Send failed', { to: params.to, subject: params.subject, error });
      return { success: false, error: error.message };
    }

    if (process.env.NODE_ENV === 'development') {
      console.info('[email] Sent', { to: params.to, subject: params.subject });
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown email error';
    console.error('[email] Send error', { to: params.to, subject: params.subject, message });
    return { success: false, error: message };
  }
}

export function sendEmailAsync(params: {
  to: string;
  subject: string;
  html: string;
}): void {
  sendEmail(params).catch((error) => {
    console.error('[email] Async send failed', error);
  });
}
