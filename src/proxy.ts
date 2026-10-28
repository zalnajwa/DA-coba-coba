import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const session = request.cookies.get('catatanku_session');
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');

  // Allow API routes to handle their own auth or pass through
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Redirect to login if no session and trying to access protected route
  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to dashboard if logged in and trying to access login page
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
