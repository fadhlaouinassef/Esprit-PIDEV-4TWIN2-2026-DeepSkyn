import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Routes protégées pour les utilisateurs
  if (pathname.startsWith('/user')) {
    if (!token) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
    if (token.role === 'ADMIN') {
    return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Routes protégées pour les admins
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
    if (token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/user', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/user/:path*', '/admin/:path*'],
};
