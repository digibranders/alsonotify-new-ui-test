import { NextResponse, NextRequest } from "next/server";

export default async function proxy(req: NextRequest) {
  const response = NextResponse;
  const hasToken = req.cookies.get("_token");
  const pathname = req.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/register", "/forgot-password", "/company-details"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // If on root path "/" and has token, redirect to dashboard
  if (pathname === "/" && hasToken) {
    return response.redirect(new URL("/dashboard", req.url));
  }

  // If on root without token, allow (will show login)
  if (pathname === "/" && !hasToken) {
    return response.next();
  }

  // If accessing protected route without token, redirect to "/"
  if (!isPublicRoute && !hasToken) {
    return response.redirect(new URL("/", req.url));
  }

  // If accessing login/register with token, redirect to dashboard
  if ((pathname === "/login" || pathname === "/register") && hasToken) {
    return response.redirect(new URL("/dashboard", req.url));
  }

  return response.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
