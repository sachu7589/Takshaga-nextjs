import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './app/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/register'];
  
  // Allow public access to share estimate pages
  if (pathname.startsWith('/share/estimate/')) {
    return NextResponse.next();
  }
  
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // For now, allow all dashboard access for testing
  if (pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  return NextResponse.next();
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 