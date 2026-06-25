# Digital Heroes Golf

Digital Heroes Golf is a subscription-driven web application that turns monthly Stableford golf scores into prize-draw entries while directing a configurable share of each subscription to charity. Members can log scores, follow draw results, manage their charity allocation, donate independently, and upload winner verification documents from a polished dashboard.

The product is built for trainee-assignment evaluation and production-style deployment. It includes a public marketing site, authentication, Stripe subscriptions and donations, Supabase-backed data with row-level security, winner verification, notifications, transactional email hooks, and a role-gated admin dashboard for operational control.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| UI | React, Tailwind CSS, Framer Motion, Lucide React |
| Auth | Supabase Auth with SSR helpers |
| Database | Supabase Postgres with RLS |
| Storage | Supabase Storage (`winner-proofs`, `charity-images`) |
| Payments | Stripe Checkout, Billing Portal, Webhooks |
| Email | Resend |
| Deployment | Vercel + new Supabase project |

## Prerequisites

- Node.js 18+
- Supabase account
- Stripe account
- Vercel account
- Stripe CLI for local webhook testing

Use a **new Vercel account** and a **new Supabase project** for submission/deployment. Do not deploy this assignment into a personal production account or shared personal Supabase project.

## Local Development Setup

1. **Clone repo**

   ```bash
   git clone <repo-url>
   cd digital-heroes-golf
   ```

2. **Install dependencies**

   ```bash
   npm install
   cp .env.example .env.local
   ```

3. **Create Supabase project and run `schema.sql`**

   - Create a new Supabase project.
   - Open Supabase SQL Editor.
   - Run `supabase/schema.sql`.
   - Run `supabase/patches.sql` if deploying over an existing database.
   - Run `supabase/seed-charities.sql` or `supabase/seed.sql` for sample data.

   You can also use the helper script after filling database env vars:

   ```bash
   npm run db:setup
   ```

4. **Create Stripe products and prices**

   Create one subscription product with two recurring prices:

   - Monthly: `GBP 10 / month`
   - Yearly: `GBP 100 / year`

   Copy both Price IDs into `.env.local`:

   ```env
   STRIPE_MONTHLY_PRICE_ID=price_...
   STRIPE_YEARLY_PRICE_ID=price_...
   ```

   The repo also includes a helper:

   ```bash
   npm run stripe:setup
   ```

5. **Fill `.env.local` with all values**

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   SUPABASE_SECRET_KEY=...
   DATABASE_URL=postgresql://...
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_MONTHLY_PRICE_ID=price_...
   STRIPE_YEARLY_PRICE_ID=price_...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   RESEND_API_KEY=re_...
   EMAIL_FROM="Digital Heroes <no-reply@your-domain.com>"
   ```

6. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

7. **Set up Stripe webhook listener with Stripe CLI**

   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   Copy the `whsec_...` signing secret into `STRIPE_WEBHOOK_SECRET` and restart the dev server.

## Stripe Setup Instructions

### Create products and prices

1. Open Stripe Dashboard in test mode.
2. Go to **Product catalog**.
3. Create product: `Digital Heroes Golf Subscription`.
4. Add recurring price: `GBP 10`, billed monthly.
5. Add recurring price: `GBP 100`, billed yearly.
6. Optional: run `npm run stripe:setup` to create the same catalog from the codebase.

### Get Price IDs

1. Open each price in Stripe.
2. Copy the ID beginning with `price_`.
3. Set:

   ```env
   STRIPE_MONTHLY_PRICE_ID=price_...
   STRIPE_YEARLY_PRICE_ID=price_...
   ```

### Configure webhook endpoint

Local endpoint:

```text
http://localhost:3000/api/webhooks/stripe
```

Production endpoint:

```text
https://YOUR_VERCEL_DOMAIN.vercel.app/api/webhooks/stripe
```

### Webhook events to subscribe to

Subscribe to these 5 Stripe events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

The webhook handler also safely handles `invoice.payment_succeeded` for renewal notifications, so adding it in Stripe is recommended even though the minimum required operational set above is five events.

## Supabase Setup

1. Create a new Supabase project for deployment.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. Run `supabase/seed.sql` for sample charities, sample users, scores, and draws, or run `supabase/seed-charities.sql` if you only want active charities.
4. Create storage bucket `winner-proofs` if it was not created by SQL:
   - Public: `false`
   - File size limit: `5 MB`
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `application/pdf`
5. Apply storage policies for `winner-proofs`:
   - Authenticated users can insert into their own folder: `(storage.foldername(name))[1] = auth.uid()::text`
   - Authenticated users can select from their own folder.
   - Admin users can select all winner proofs.
6. Create storage bucket `charity-images` if it was not created by SQL:
   - Public: `true`
   - File size limit: `5 MB`
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
   - Public read; admin insert/update/delete.
7. Get values from Supabase **Project Settings > API**:
   - Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
   - anon or publishable key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - service role or secret key -> `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY`
8. Get database connection details from **Project Settings > Database** and set `DATABASE_URL` or `SUPABASE_DB_PASSWORD` for setup scripts.

## Vercel Deployment

1. Push the repository to GitHub.
2. Create or use a **new Vercel account** for the assignment.
3. Import the GitHub repository into Vercel.
4. Confirm project settings:
   - Framework: Next.js
   - Build command: `npm run build`
   - Output directory: `.next`
   - Region: London (`lhr1`) via `vercel.json`
5. Set all environment variables in Vercel Dashboard > Project > Settings > Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_SECRET_KEY`
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_MONTHLY_PRICE_ID`
   - `STRIPE_YEARLY_PRICE_ID`
   - `NEXT_PUBLIC_APP_URL`
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
6. Set `NEXT_PUBLIC_APP_URL` to the production Vercel URL:

   ```env
   NEXT_PUBLIC_APP_URL=https://YOUR_VERCEL_DOMAIN.vercel.app
   ```

7. Update `next.config.mjs` image domain placeholder:

   ```ts
   images: {
     domains: ['YOUR_SUPABASE_PROJECT.supabase.co'],
   }
   ```

   Replace `YOUR_SUPABASE_PROJECT` with the new Supabase project ref.

8. Deploy.
9. Add the production webhook URL to Stripe:

   ```text
   https://YOUR_VERCEL_DOMAIN.vercel.app/api/webhooks/stripe
   ```

10. Set the production Stripe webhook signing secret in Vercel as `STRIPE_WEBHOOK_SECRET`.
11. Verify `/health` returns JSON:

   ```json
   { "status": "ok", "timestamp": "...", "version": "1.0.0" }
   ```

## Test Credentials

For recruiter testing after seeding users with `npm run db:seed-users`:

### Admin Account

Email: `admin@digitalheroes.co.in`  
Password: `Admin2025!`

### Test Subscriber

Email: `testuser@digitalheroes.co.in`  
Password: `TestUser2025!`

### Stripe Test Card

Card: `4242 4242 4242 4242`  
Expiry: any future date  
CVC: any 3 digits  
Postcode: any valid postcode

## Testing the Draw System

1. Sign in as admin: `admin@digitalheroes.co.in` / `Admin2025!`.
2. Open `/admin/draws`.
3. Create or select a draft draw for the current month.
4. Confirm at least one active subscriber has five valid scores. You can seed data with `supabase/seed.sql` or add scores from the subscriber dashboard.
5. Click **Simulate** to preview entries and expected winners without publishing.
6. Review drawn numbers, match groups, prize pools, and rollover values.
7. Click **Publish** to run the draw and create winner entries.
8. Sign in as the subscriber and open `/dashboard/draws` to view draw results.
9. If the subscriber is a winner, upload proof in the winner flow.
10. Return to `/admin/winners`, inspect the proof, verify or reject it, and mark payout status.
11. Confirm notification bell entries are created for draw publication and winner verification.
12. Run automated draw checks:

    ```bash
    npm run test:draw
    npm run test:qa
    ```

## Health Check

`GET /health` returns:

```json
{
  "status": "ok",
  "timestamp": "2026-06-25T00:00:00.000Z",
  "version": "1.0.0"
}
```

## npm Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start local Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint checks |
| `npm run db:setup` | Apply schema, patches, charity seeds, and storage setup |
| `npm run db:seed-users` | Create recruiter admin and subscriber users |
| `npm run stripe:setup` | Create/reuse Stripe product and prices |
| `npm run test:draw` | Draw engine tests |
| `npm run test:admin` | Admin API integration checks; requires dev server and admin auth context |
| `npm run test:qa` | QA scenario checks |

## Evaluation Criteria Checklist

| Criterion | What Recruiters Look For | Check |
| --- | --- | --- |
| Requirements Interpretation | All PRD features built, nothing missing, no misinterpretations | [x] |
| System Design | Clean DB schema, proper RLS, logical API structure, TypeScript types | [x] |
| UI/UX Creativity | Not a typical golf site, emotion-driven, Framer Motion, polished | [x] |
| Data Handling | Rolling score logic exact, draw matching correct, prize split accurate | [x] |
| Scalability Thinking | Types are extensible, multi-country ready comments, mobile-app-ready structure | [x] |
| Problem-Solving | Edge cases handled, validation everywhere, ambiguities resolved and documented | [x] |

## Implementation Order Reference

- Part 0 -> Scaffold & types
- Part 1 -> Database schema
- Part 2 -> Auth & middleware
- Part 3 -> Stripe subscriptions
- Part 4 -> Score system
- Part 5 -> Draw engine
- Part 6 -> Charity system
- Part 7 -> Winner verification
- Part 8 -> User dashboard
- Part 9 -> Admin dashboard
- Part 10 -> Public pages & homepage
- Part 11 -> Email notifications
- Part 12 -> Responsive polish & animations
- Part 13 -> Testing & bug fixes
- Part 14 -> Deployment prep

## Project Structure

```text
src/
  app/           Next.js App Router pages, layouts, and API routes
  components/    Shared UI, public pages, dashboard, admin, auth
  hooks/         Client hooks
  lib/           Supabase, Stripe, email, draw engine, validation, SEO
  styles/        Tailwind globals
supabase/        schema.sql, patches.sql, seed files
scripts/         database setup, test users, Stripe setup, QA scripts
public/images/   local marketing and charity images
```

## Deployment Notes

- Use a new Supabase project and a new Vercel account for assignment deployment.
- Never commit `.env.local` or production secrets.
- Keep Stripe in test mode for recruiter review unless production billing is explicitly required.
- After Vercel assigns a domain, update `NEXT_PUBLIC_APP_URL` and the Stripe production webhook endpoint.
- Replace placeholder domains in `vercel.json` and `next.config.mjs` before final production submission.

## License

Private - Digital Heroes Golf.
