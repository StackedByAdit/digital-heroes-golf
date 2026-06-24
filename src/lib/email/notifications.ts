import { format } from 'date-fns';
import {
  drawResultEmail,
  paymentFailedEmail,
  subscriptionCancelledEmail,
  welcomeEmail,
  winnerVerificationEmail,
} from '@/lib/email/templates';
import { sendEmailAsync } from '@/lib/email/sender';
import { createAdminClient } from '@/lib/supabase/server';
import type { SimulationResult, SubscriberWithScores } from '@/lib/draw/processing';
import type Stripe from 'stripe';

export async function notifyWelcomeEmail(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata.userId;
  if (!userId) return;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, email, charity_id')
    .eq('id', userId)
    .maybeSingle();

  if (!profile?.email) return;

  let charityName = 'your chosen charity';
  if (profile.charity_id) {
    const { data: charity } = await admin
      .from('charities')
      .select('name')
      .eq('id', profile.charity_id)
      .maybeSingle();
    if (charity?.name) charityName = charity.name;
  }

  const template = welcomeEmail({
    name: profile.full_name,
    charity: charityName,
  });

  sendEmailAsync({
    to: profile.email,
    subject: template.subject,
    html: template.html,
  });
}

export function notifyDrawResultEmails(
  month: string,
  subscribers: SubscriberWithScores[],
  entries: SimulationResult['entries']
): void {
  for (const entry of entries) {
    const subscriber = subscribers.find((item) => item.profile.id === entry.user_id);
    if (!subscriber?.profile.email) continue;

    const won = entry.prize_amount > 0;
    const template = drawResultEmail({
      name: subscriber.profile.full_name,
      month,
      won,
      prize: won ? entry.prize_amount : undefined,
      matchType: entry.match_type ?? undefined,
    });

    sendEmailAsync({
      to: subscriber.profile.email,
      subject: template.subject,
      html: template.html,
    });
  }
}

export function notifyWinnerVerificationEmail(params: {
  email: string;
  name: string;
  status: 'approved' | 'rejected';
  prize?: number;
  notes?: string;
}): void {
  const template = winnerVerificationEmail({
    name: params.name,
    status: params.status,
    prize: params.prize,
    notes: params.notes,
  });

  sendEmailAsync({
    to: params.email,
    subject: template.subject,
    html: template.html,
  });
}

export function notifySubscriptionCancelledEmail(params: {
  email: string;
  name: string;
  endDate: string;
}): void {
  const template = subscriptionCancelledEmail({
    name: params.name,
    endDate: params.endDate,
  });

  sendEmailAsync({
    to: params.email,
    subject: template.subject,
    html: template.html,
  });
}

export function notifyPaymentFailedEmail(params: {
  email: string;
  name: string;
  retryDate: string;
}): void {
  const template = paymentFailedEmail({
    name: params.name,
    retryDate: params.retryDate,
  });

  sendEmailAsync({
    to: params.email,
    subject: template.subject,
    html: template.html,
  });
}

export function formatEmailDate(date: Date): string {
  return format(date, 'd MMMM yyyy');
}

export function formatRetryDateFromInvoice(invoice: Stripe.Invoice): string {
  if (invoice.next_payment_attempt) {
    return formatEmailDate(new Date(invoice.next_payment_attempt * 1000));
  }

  const retry = new Date();
  retry.setDate(retry.getDate() + 3);
  return formatEmailDate(retry);
}
