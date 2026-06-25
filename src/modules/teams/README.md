# Teams module (future)

Corporate and group accounts: one billing entity, multiple golfers.

## Database

- `public.teams` — team metadata and subscription status
- `public.team_members` — membership and roles (`owner`, `admin`, `member`)
- `profiles.team_id` — optional FK for quick membership lookup

## Activation checklist

1. Team owner checkout flow (seat-based or pooled subscription)
2. RLS policies: members read own team; owners manage members
3. Dashboard shell: team switcher and aggregated score/draw views
4. Stripe Customer Portal or custom billing for seat changes
5. Expose mutations under `/api/v1/teams`

## Types

See `Team`, `TeamRole`, and `TeamMember` in `src/types/index.ts`.
