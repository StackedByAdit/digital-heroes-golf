export type EmailTemplate = {
  subject: string;
  html: string;
};

function layout(content: string, options?: { guest?: boolean }): string {
  const footerNote = options?.guest
    ? 'You received this receipt after a donation via Digital Heroes Golf.'
    : 'You&apos;re receiving this because you have a Digital Heroes Golf account.';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Digital Heroes Golf</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f6f1;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8f6f1;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="background-color:#1a3c2e;padding:28px 32px;">
              <p style="margin:0;font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:0.3px;">Digital Heroes</p>
              <p style="margin:8px 0 0;font-size:13px;color:#c9a84c;">Play golf. Win prizes. Change lives.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#1c1c1e;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#6b7280;">
              ${footerNote}
              <br />
              &copy; ${new Date().getFullYear()} Digital Heroes Golf
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:28px 0 0;">
    <a href="${href}" style="display:inline-block;background-color:#c9a84c;color:#1c1c1e;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:999px;font-size:14px;">${label}</a>
  </p>`;
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://digitalheroes.golf';

export function welcomeEmail(params: { name: string; charity: string }): EmailTemplate {
  const html = layout(`
    <p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:#1a3c2e;">Welcome, ${params.name}!</p>
    <p style="margin:0 0 16px;">Thank you for joining Digital Heroes Golf. Your subscription is active, and you&apos;re now supporting <strong style="color:#1a3c2e;">${params.charity}</strong> with every month you play.</p>
    <p style="margin:0;">Log your Stableford scores, enter the monthly draw, and watch your impact grow — on and off the course.</p>
    ${button(`${appUrl}/dashboard`, 'Go to your dashboard')}
  `);

  return {
    subject: 'Welcome to Digital Heroes Golf',
    html,
  };
}

export function drawResultEmail(params: {
  name: string;
  month: string;
  won: boolean;
  prize?: number;
  matchType?: string;
}): EmailTemplate {
  const prizeText =
    params.won && params.prize !== undefined
      ? ` You matched ${params.matchType ?? 'numbers'} and won <strong style="color:#1a3c2e;">£${params.prize.toFixed(2)}</strong>.`
      : '';

  const body = params.won
    ? `<p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:#1a3c2e;">Congratulations, ${params.name}!</p>
       <p style="margin:0 0 16px;">The ${params.month} draw results are in.${prizeText}</p>
       <p style="margin:0;">Please upload your scorecard proof in your dashboard so we can verify and process your prize.</p>
       ${button(`${appUrl}/dashboard/draws`, 'View draw results')}`
    : `<p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:#1a3c2e;">${params.month} draw results</p>
       <p style="margin:0 0 16px;">Hi ${params.name}, the monthly draw for ${params.month} has been published.</p>
       <p style="margin:0;">Better luck next month — keep logging your scores to stay in the running and keep supporting your charity.</p>
       ${button(`${appUrl}/dashboard/draws`, 'See this month\'s numbers')}`;

  return {
    subject: params.won
      ? `You won in the ${params.month} draw!`
      : `${params.month} draw results are in`,
    html: layout(body),
  };
}

export function winnerVerificationEmail(params: {
  name: string;
  status: 'approved' | 'rejected';
  prize?: number;
  notes?: string;
}): EmailTemplate {
  const approved = params.status === 'approved';

  const body = approved
    ? `<p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:#1a3c2e;">Prize approved</p>
       <p style="margin:0 0 16px;">Hi ${params.name}, great news — your winner verification has been approved${
         params.prize !== undefined
           ? ` for <strong style="color:#1a3c2e;">£${params.prize.toFixed(2)}</strong>`
           : ''
       }.</p>
       <p style="margin:0;">Your payout is being processed. Thank you for playing with purpose.</p>
       ${button(`${appUrl}/dashboard/draws`, 'View your dashboard')}`
    : `<p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:#1a3c2e;">Verification update</p>
       <p style="margin:0 0 16px;">Hi ${params.name}, we weren&apos;t able to approve your winner verification this time.</p>
       ${
         params.notes
           ? `<p style="margin:0 0 16px;padding:12px 16px;background-color:#fef3c7;border-radius:8px;color:#92400e;"><strong>Note from our team:</strong> ${params.notes}</p>`
           : ''
       }
       <p style="margin:0;">You can upload updated scorecard proof from your dashboard if you&apos;d like to resubmit.</p>
       ${button(`${appUrl}/dashboard/draws`, 'Upload new proof')}`;

  return {
    subject: approved
      ? 'Your prize has been approved'
      : 'Update on your winner verification',
    html: layout(body),
  };
}

export function subscriptionCancelledEmail(params: {
  name: string;
  endDate: string;
}): EmailTemplate {
  const html = layout(`
    <p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:#1a3c2e;">Subscription cancelled</p>
    <p style="margin:0 0 16px;">Hi ${params.name}, we&apos;ve processed your cancellation request.</p>
    <p style="margin:0 0 16px;">Your access remains until <strong style="color:#1a3c2e;">${params.endDate}</strong>. After that, you won&apos;t be entered into monthly draws until you resubscribe.</p>
    <p style="margin:0;">We&apos;d love to see you back on the course whenever you&apos;re ready.</p>
    ${button(`${appUrl}/pricing`, 'Resubscribe anytime')}
  `);

  return {
    subject: 'Your Digital Heroes subscription has been cancelled',
    html,
  };
}

export function paymentFailedEmail(params: {
  name: string;
  retryDate: string;
}): EmailTemplate {
  const html = layout(`
    <p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:#1a3c2e;">Payment issue</p>
    <p style="margin:0 0 16px;">Hi ${params.name}, we couldn&apos;t process your latest subscription payment.</p>
    <p style="margin:0 0 16px;">Stripe will automatically retry on <strong style="color:#1a3c2e;">${params.retryDate}</strong>. Please update your payment method to avoid interruption to your draw entries and charity contributions.</p>
    <p style="margin:0;">If you need help, reply to this email or visit your account settings.</p>
    ${button(`${appUrl}/dashboard/account`, 'Update payment method')}
  `);

  return {
    subject: 'Action needed: subscription payment failed',
    html,
  };
}

export function donationConfirmationEmail(params: {
  name: string;
  charityName: string;
  amountGbp: number;
}): EmailTemplate {
  return {
    subject: `Donation confirmed — ${params.charityName}`,
    html: layout(`
    <p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:#1a3c2e;">Thank you, ${params.name}!</p>
    <p style="margin:0 0 16px;">Your one-off donation of <strong style="color:#1a3c2e;">£${params.amountGbp.toFixed(2)}</strong> to <strong style="color:#1a3c2e;">${params.charityName}</strong> has been received.</p>
    <p style="margin:0;">Your generosity helps our partner charities deliver real impact. Thank you for playing your part.</p>
    ${button(`${appUrl}/charities`, 'Explore more charities')}
  `, { guest: true }),
  };
}
