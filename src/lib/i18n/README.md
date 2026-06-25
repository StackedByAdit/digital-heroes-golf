# Internationalisation (i18n)

Multi-country expansion scaffold for Digital Heroes Golf.

## Current state

- **Active locale:** `en-GB` only (`DEFAULT_LOCALE` in `config.ts`)
- **Monetary values:** stored as `numeric` in Postgres (no float precision issues)
- **Display formatting:** swap `LOCALE_CONFIG` entries to support new regions without schema changes

## Supported locales (scaffold)

| Locale | Currency | Monthly fee | Stripe region |
| --- | --- | --- | --- |
| `en-GB` | GBP (£10) | £10 | `uk` |
| `en-US` | USD ($12) | $12 | `us` |
| `en-IE` | EUR (€11) | €11 | `eu` |

## Activation checklist

1. Resolve locale from user profile, cookie, or `Accept-Language`
2. Create Stripe prices per region and map `stripeRegion` → Price IDs
3. Replace hard-coded `£10` / GBP labels in checkout and marketing copy
4. Use `dateFormat` for score dates and draw month display
5. Add translation files under `src/lib/i18n/messages/` when copy localisation is required
