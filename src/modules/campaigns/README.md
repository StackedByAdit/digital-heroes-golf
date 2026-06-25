# Campaigns module (future)

Time-limited charity drives, sponsored draws, and corporate fundraising events.

## Database

- `public.campaigns` table is defined in `supabase/schema.sql`
- Zero coupling to core draw logic until `campaign_id` is added to `draws`

## Activation checklist

1. Wire admin UI to create and publish campaigns
2. Optional: `ALTER TABLE draws ADD COLUMN campaign_id uuid REFERENCES campaigns(id)`
3. Filter charity spotlight and donation CTAs by active campaign
4. Expose read endpoints under `/api/v1/campaigns`

## Types

See `Campaign` in `src/types/index.ts`.
