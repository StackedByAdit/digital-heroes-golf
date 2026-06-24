import { createAdminClient } from '@/lib/supabase/server';
import { notifyDonationConfirmationEmail } from '@/lib/email/notifications';
import { createUserNotification } from '@/lib/notifications/service';
import type Stripe from 'stripe';

export async function completeDonationCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<void> {
  if (session.metadata?.type !== 'donation') return;
  if (session.mode !== 'payment') return;

  const donationId = session.metadata.donationId;
  if (!donationId) return;

  const admin = createAdminClient();

  const { data: donation, error: fetchError } = await admin
    .from('donations')
    .select('*, charities(name)')
    .eq('id', donationId)
    .maybeSingle();

  if (fetchError || !donation) {
    throw new Error(fetchError?.message ?? 'Donation not found');
  }

  if (donation.status === 'completed') return;

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const { error: updateError } = await admin
    .from('donations')
    .update({
      status: 'completed',
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq('id', donationId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const charityName =
    (donation.charities as { name: string } | null)?.name ?? 'your chosen charity';

  notifyDonationConfirmationEmail({
    email: donation.donor_email,
    name: donation.donor_name ?? 'Friend',
    charityName,
    amountGbp: Number(donation.amount_gbp),
  });

  if (donation.user_id) {
    await createUserNotification({
      userId: donation.user_id,
      type: 'donation',
      title: 'Thank you for your donation',
      body: `Your £${Number(donation.amount_gbp).toFixed(2)} gift to ${charityName} was received.`,
      href: '/donate/success',
    });
  }
}
