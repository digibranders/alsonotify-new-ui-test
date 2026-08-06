import { NextResponse, type NextRequest } from 'next/server';

/**
 * Server-side route guard.
 *
 * SCOPE: this checks that the `_token` httpOnly cookie is PRESENT. It does not
 * verify the signature — that would require the JWT secret in the edge runtime,
 * duplicating the trust boundary. The backend remains the authoritative gate on
 * every API call.
 *
 * What this buys us: unauthenticated visitors stop receiving protected page
 * shells and their JavaScript, and authenticated users stop seeing the
 * momentary flash of a protected layout before the client-side redirect fires.
 */

const AUTH_COOKIE = '_token';

/** Routes reachable without a session. */
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/password-reset',
];

/** Routes an authenticated user should be bounced away from. */
const AUTH_ONLY_ROUTES = ['/login', '/register'];

function isPublic(pathname: string): boolean {
  // Exact match, or a path segment beneath it. Deliberately NOT startsWith on
  // the bare string: that would make "/loginsomething" public.
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE)?.value);

  // Signed in but sitting on login/register — send them into the app.
  if (hasSession && AUTH_ONLY_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    // Round-trip the intended destination. safeRedirectPath() validates it
    // again on the way out, so a crafted value cannot become an open redirect.
    loginUrl.searchParams.set('redirect', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next internals, static assets and the Sentry tunnel.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
