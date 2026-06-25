// API versioning — all future mobile endpoints live under /api/v1/
// React Native can consume the same backend without breaking web API contracts.

export async function GET() {
  return Response.json({
    status: 'ok',
    version: '1.0.0',
    api: 'v1',
    timestamp: new Date().toISOString(),
    features: {
      scores: true,
      draws: true,
      charities: true,
      teams: false, // scaffold ready, not activated
      campaigns: false, // scaffold ready, not activated
      multiCountry: false, // scaffold ready, en-GB only
    },
  });
}
