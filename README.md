# Digital Heroes Golf

Play golf, win prizes, and support charities — a Next.js 14 app with Supabase auth/database, Stripe subscriptions and one-off donations, and a full admin dashboard.

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account (test mode is fine for local dev)
- Optional: [Resend](https://resend.com) for transactional email

## Quick start

1. **Clone and install**

   ```bash
   npm install
   cp .env.example .env.local
   ```

2. **Configure `.env.local`**

   Copy keys from Supabase (Project Settings → API) and Stripe (Developers → API keys). See `.env.example` for all variables.

3. **Apply database schema and seed data**

   ```bash
   npm run db:setup
   ```

   This runs `supabase/schema.sql`, `supabase/patches.sql`, charity seeds, and storage buckets.

4. **Create Stripe prices**

   ```bash
   npm run stripe:setup
   ```

5. **Seed test users** (optional)

   ```bash
   npm run db:seed-users
   ```

6. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Test credentials

After `npm run db:seed-users`:

| Role        | Email                         | Password       |
|-------------|-------------------------------|----------------|
| Admin       | `admin@digitalheroes.golf`    | `ChangeMe123!` |
| Subscriber  | `subscriber@digitalheroes.golf` | `ChangeMe123!` |

The admin account can access `/admin`. Both accounts have active subscriptions in seed data.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin operations |
| `DATABASE_URL` or `SUPABASE_DB_PASSWORD` | Used by `npm run db:setup` |
| `STRIPE_SECRET_KEY` | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification |
| `STRIPE_MONTHLY_PRICE_ID` / `STRIPE_YEARLY_PRICE_ID` | From `npm run stripe:setup` |
| `NEXT_PUBLIC_APP_URL` | Base URL for redirects (e.g. `http://localhost:3000`) |
| `RESEND_API_KEY` | Transactional email (optional locally) |

## npm scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:setup` | Apply schema, patches, and seeds |
| `npm run db:seed-users` | Create admin + subscriber test users |
| `npm run stripe:setup` | Create Stripe subscription prices |
| `npm run test:draw` | Unit tests for draw engine |
| `npm run test:admin` | Admin API integration tests (dev server required) |
| `npm run test:qa` | End-to-end QA scenarios |

## Features

- **Member dashboard** — log Stableford scores, view draw history, manage charity allocation, upload winner proof
- **Independent donations** — `/donate` one-off Stripe checkout (guest or logged-in)
- **Charity directory** — search and filter by category; admin image upload to Supabase Storage
- **Notifications** — in-app bell with billing, winner, and donation alerts
- **Admin panel** — `/admin` for users, charities, draws (simulate/publish), winners, reports

## Stripe webhooks (local)

Forward webhooks to your dev server:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## Project structure

```
src/
  app/           # Next.js App Router (public, auth, dashboard, admin, API)
  components/    # UI components
  lib/           # Supabase, Stripe, email, draw engine, validations
supabase/        # schema.sql, patches.sql, seed data
scripts/         # db setup, tests, Stripe setup
```

## License

Private — Digital Heroes Golf.
