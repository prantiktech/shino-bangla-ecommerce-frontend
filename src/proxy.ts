import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js 16 Request Proxy (Middleware)
 * Handles route-level authentication, session protection, and redirects
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. User Protected Routes: /account, /checkout
  // The payment return page must stay public: guests land there after paying online.
  const isPublicCheckoutPage = pathname === '/checkout/payment';
  if (
    (pathname.startsWith('/account') || pathname.startsWith('/checkout')) &&
    !isPublicCheckoutPage
  ) {
    const hasUserToken =
      request.cookies.has('token') ||
      request.cookies.has('client-token') ||
      request.cookies.has('customer_token') ||
      request.cookies.has('admin_token');

    if (!hasUserToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Admin Protected Routes: /admin, /admin/*
  if (pathname.startsWith('/admin')) {
    const hasAdminToken =
      request.cookies.has('admin_token') ||
      request.cookies.has('admin_client_token');
    const isLoginPage = pathname === '/admin/login';

    if (isLoginPage) {
      if (hasAdminToken) {
        // If already logged in, redirect to admin dashboard
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.next();
    }

    if (!hasAdminToken) {
      // Redirect to admin login with redirect parameter
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/account',
    '/account/:path*',
    '/checkout',
    '/checkout/:path*',
  ],
};
