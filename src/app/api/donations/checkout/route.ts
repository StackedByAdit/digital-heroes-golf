import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, getAppUrl, getOrCreateStripeCustomer } from '@/lib/stripe/server';
import { DonationCheckoutSchema } from '@/lib/validations';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = DonationCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { charity_id, amount_gbp, donor_name, donor_email } = parsed.data;

  try {
    const admin = createAdminClient();
    const { data: charity, error: charityError } = await admin
      .from('charities')
      .select('id, name, is_active')
      .eq('id', charity_id)
      .maybeSingle();

    if (charityError || !charity?.is_active) {
      return NextResponse.json({ error: 'Charity not found' }, { status: 404 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let email = donor_email;
    let name = donor_name;
    let userId: string | null = null;
    let customerId: string | undefined;

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      userId = user.id;
      email = email ?? profile?.email ?? user.email ?? undefined;
      name = name ?? profile?.full_name ?? undefined;

      if (email && name) {
        customerId = await getOrCreateStripeCustomer(user.id, email, name);
      }
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required for guest donations' },
        { status: 400 }
      );
    }

    const amountPence = Math.round(amount_gbp * 100);
    const appUrl = getAppUrl();

    const { data: pendingDonation, error: insertError } = await admin
      .from('donations')
      .insert({
        user_id: userId,
        charity_id,
        amount_gbp,
        donor_email: email,
        donor_name: name ?? null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError) throw new Error(insertError.message);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'gbp',
            unit_amount: amountPence,
            product_data: {
              name: `Donation to ${charity.name}`,
              description: 'Independent one-off donation via Digital Heroes Golf',
            },
          },
        },
      ],
      metadata: {
        type: 'donation',
        donationId: pendingDonation.id,
        charityId: charity_id,
        userId: userId ?? '',
      },
      success_url: `${appUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/donate?charity=${charity_id}`,
    });

    await admin
      .from('donations')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', pendingDonation.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[donations checkout]', error);
    return NextResponse.json(
      { error: 'Failed to start donation checkout' },
      { status: 500 }
    );
  }
}
