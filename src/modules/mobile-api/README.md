# Mobile API layer (future)

Versioned REST API for a React Native client consuming the same Supabase-backed backend.

## Routing convention

All mobile-facing endpoints live under `/api/v1/*`:

- `GET /api/v1/health` — version probe and feature flags (implemented)
- Future: `/api/v1/scores`, `/api/v1/draws`, `/api/v1/charities`, etc.

## Design principles

- JSON request/response bodies; no GraphQL migration required
- Bearer token auth via Supabase session JWT
- Breaking changes ship as `/api/v2/*` without affecting web App Router handlers
- Web dashboard may continue using server components and existing `/api/*` routes

## Feature flags

Check `GET /api/v1/health` for `features.teams`, `features.campaigns`, and `features.multiCountry`.
