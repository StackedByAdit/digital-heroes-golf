import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  mergeSessionCookies,
  updateSession,
} from '@/lib/supabase/middleware';
import {
  dashboardAccessFromNavProfile,
  NAV_PROFILE_SELECT,
  type NavProfileRow,
} from '@/lib/auth/nav-profile';
import { resolvePostLoginRedirect } from '@/lib/auth/post-login';
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

function needsStrictAuth(pathname: string): boolean {
  if (pathname === '/login') return true;
  if (pathname.startsWith('/admin')) return true;
  if (matchesPath(pathname, DASHBOARD_PATHS)) return true;
  if (pathname.startsWith('/api') && isProtectedApi(pathname)) return true;
  return false;
}

function needsSubscriptionGate(pathname: string): boolean {
  if (matchesPath(pathname, SUBSCRIPTION_REQUIRED_PATHS)) return true;
  if (pathname.startsWith('/api') && isProtectedApi(pathname)) return true;
  return false;
}

function isSubscriptionMarketingPath(pathname: string): boolean {
  return pathname === '/pricing' || pathname === '/signup';
}

export async function middleware(request: NextRequest) {
  const { response: sessionResponse, user: sessionUser } = await updateSession(request);
  const { pathname } = request.nextUrl;

  let user = sessionUser;

  if (needsStrictAuth(pathname)) {
    if (sessionUser) {
      const supabase = createServerClient(
        getSupabaseUrl(),
        getSupabaseAnonKey(),
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll() {},
          },
        }
      );

      const {
        data: { user: verifiedUser },
      } = await supabase.auth.getUser();
      user = verifiedUser;
    }
  }

  const requestHeaders = new Headers(request.headers);
  let role: string | null = null;
  let subscriptionStatus: string | null = null;
  let subscriptionEndsAt: string | null = null;

  if (
    user &&
    (needsStrictAuth(pathname) ||
      needsSubscriptionGate(pathname) ||
      isSubscriptionMarketingPath(pathname))
  ) {
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
      .select(NAV_PROFILE_SELECT)
      .eq('id', user.id)
      .maybeSingle();

    const navProfile = profile as NavProfileRow | null;
    role = navProfile?.role ?? null;
    subscriptionStatus = navProfile?.subscription_status ?? null;
    subscriptionEndsAt = navProfile?.subscription_ends_at ?? null;
    requestHeaders.set('x-user-id', user.id);
    if (role) {
      requestHeaders.set('x-user-role', role);
    }
    if (subscriptionStatus) {
      requestHeaders.set('x-subscription-status', subscriptionStatus);
    }
    if (subscriptionEndsAt) {
      requestHeaders.set('x-subscription-ends-at', subscriptionEndsAt);
    }
  } else if (user) {
    requestHeaders.set('x-user-id', user.id);
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('redirectTo', pathname);

  const pricingUrl = request.nextUrl.clone();
  pricingUrl.pathname = '/pricing';

  const dashboardUrl = request.nextUrl.clone();
  dashboardUrl.pathname = '/dashboard';

  const canAccessDashboard = dashboardAccessFromNavProfile(
    role || subscriptionStatus
      ? {
          role,
          subscription_status: subscriptionStatus,
          subscription_ends_at: subscriptionEndsAt,
        }
      : null,
  );

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

  if (isSubscriptionMarketingPath(pathname) && user && canAccessDashboard) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = role === 'admin' ? '/admin' : '/dashboard';
    redirectUrl.search = '';
    return finalizeResponse(
      sessionResponse,
      NextResponse.redirect(redirectUrl),
      role,
    );
  }

  if (pathname === '/login' && user) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo');
    const destination = request.nextUrl.clone();
    destination.pathname = resolvePostLoginRedirect(redirectTo, {
      role,
      subscription_status: subscriptionStatus,
      subscription_ends_at: subscriptionEndsAt,
    });
    destination.search = '';

    return finalizeResponse(
      sessionResponse,
      NextResponse.redirect(destination),
      role
    );
  }

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

  if (matchesPath(pathname, DASHBOARD_PATHS)) {
    if (!user) {
      return finalizeResponse(
        sessionResponse,
        NextResponse.redirect(loginUrl),
        role
      );
    }

    // Admins have no subscriber dashboard — send them to admin panel
    if (role === 'admin') {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = '/admin';
      return finalizeResponse(
        sessionResponse,
        NextResponse.redirect(adminUrl),
        role
      );
    }

    if (
      needsSubscriptionGate(pathname) &&
      !pathname.startsWith('/dashboard/account') &&
      !canAccessDashboard
    ) {
      return finalizeResponse(
        sessionResponse,
        NextResponse.redirect(pricingUrl),
        role
      );
    }
  }

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
        !pathname.startsWith('/api/admin') &&
        !pathname.startsWith('/api/winners/upload-proof') &&
        !canAccessDashboard &&
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
