import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  mergeSessionCookies,
  updateSession,
} from '@/lib/supabase/middleware';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

const DASHBOARD_PATHS = ['/dashboard'];
const SUBSCRIPTION_REQUIRED_PATHS = ['/dashboard'];

const LEGACY_DASHBOARD_REDIRECTS: Record<string, string> = {
  '/scores': '/dashboard/scores',
  '/draws': '/dashboard/draws',
  '/charity': '/dashboard/charity',
  '/account': '/dashboard/account',
};

const PROTECTED_API_PREFIXES = [
  '/api/draws',
  '/api/scores',
  '/api/subscriptions',
  '/api/winners',
  '/api/admin',
  '/api/user',
];

const PUBLIC_API_PREFIXES = ['/api/auth', '/api/webhooks'];

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isProtectedApi(pathname: string): boolean {
  return PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function finalizeResponse(
  sessionResponse: NextResponse,
  response: NextResponse,
  role: string | null
): NextResponse {
  mergeSessionCookies(sessionResponse, response);
  if (role) {
    response.headers.set('x-user-role', role);
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { response: sessionResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  let role: string | null = null;
  let subscriptionStatus: string | null = null;

  if (user) {
    const supabase = createServerClient(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // Session cookies are written via updateSession above.
          },
        },
      }
    );

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, subscription_status')
      .eq('id', user.id)
      .maybeSingle();

    role = profile?.role ?? null;
    subscriptionStatus = profile?.subscription_status ?? null;
    requestHeaders.set('x-user-id', user.id);
    if (role) {
      requestHeaders.set('x-user-role', role);
    }
    if (subscriptionStatus) {
      requestHeaders.set('x-subscription-status', subscriptionStatus);
    }
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('redirectTo', pathname);

  const pricingUrl = request.nextUrl.clone();
  pricingUrl.pathname = '/pricing';

  const dashboardUrl = request.nextUrl.clone();
  dashboardUrl.pathname = '/dashboard';

  for (const [legacyPath, targetPath] of Object.entries(LEGACY_DASHBOARD_REDIRECTS)) {
    if (pathname === legacyPath || pathname.startsWith(`${legacyPath}/`)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = targetPath;
      return finalizeResponse(
        sessionResponse,
        NextResponse.redirect(redirectUrl),
        role
      );
    }
  }

  if (pathname === '/login' && user) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo');
    const safeRedirect =
      redirectTo &&
      redirectTo.startsWith('/') &&
      !redirectTo.startsWith('//') &&
      !redirectTo.startsWith('/login')
        ? redirectTo
        : null;

    const destination = request.nextUrl.clone();
    destination.pathname = safeRedirect ?? '/dashboard';
    destination.search = '';

    return finalizeResponse(
      sessionResponse,
      NextResponse.redirect(destination),
      role
    );
  }

  // Admin routes
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return finalizeResponse(
        sessionResponse,
        NextResponse.redirect(loginUrl),
        role
      );
    }
    if (role !== 'admin') {
      return finalizeResponse(
        sessionResponse,
        NextResponse.redirect(dashboardUrl),
        role
      );
    }
  }

  // Dashboard routes (includes /scores, /draws, etc.)
  if (matchesPath(pathname, DASHBOARD_PATHS)) {
    if (!user) {
      return finalizeResponse(
        sessionResponse,
        NextResponse.redirect(loginUrl),
        role
      );
    }

    if (
      role !== 'admin' &&
      matchesPath(pathname, SUBSCRIPTION_REQUIRED_PATHS) &&
      !pathname.startsWith('/dashboard/account') &&
      subscriptionStatus !== 'active'
    ) {
      return finalizeResponse(
        sessionResponse,
        NextResponse.redirect(pricingUrl),
        role
      );
    }
  }

  // Protected API routes
  if (pathname.startsWith('/api') && !isPublicApi(pathname)) {
    if (isProtectedApi(pathname)) {
      if (!user) {
        return finalizeResponse(
          sessionResponse,
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
          role
        );
      }

      if (pathname.startsWith('/api/admin') && role !== 'admin') {
        return finalizeResponse(
          sessionResponse,
          NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
          role
        );
      }

      if (
        role !== 'admin' &&
        !pathname.startsWith('/api/admin') &&
        !pathname.startsWith('/api/winners/upload-proof') &&
        subscriptionStatus !== 'active' &&
        !pathname.startsWith('/api/subscriptions') &&
        !pathname.startsWith('/api/user')
      ) {
        return finalizeResponse(
          sessionResponse,
          NextResponse.json(
            { error: 'Active subscription required' },
            { status: 403 }
          ),
          role
        );
      }
    }
  }

  const nextResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return finalizeResponse(sessionResponse, nextResponse, role);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
