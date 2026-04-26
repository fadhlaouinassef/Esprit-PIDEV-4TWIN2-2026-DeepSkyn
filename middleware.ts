import {NextRequest, NextResponse} from 'next/server';
import {getToken} from 'next-auth/jwt';
import {DEFAULT_LOCALE, isAppLocale, LOCALE_COOKIE_NAME} from './src/i18n/locales';

function pickLocaleFromAcceptLanguage(acceptLanguage: string | null): string | null {
  if (!acceptLanguage) return null;

  const parts = acceptLanguage
    .split(',')
    .map((part) => part.trim().split(';')[0])
    .filter(Boolean);

  for (const tag of parts) {
    const base = tag.toLowerCase().split('-')[0];
    if (isAppLocale(base)) return base;
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;

  if (pathname.startsWith('/user') || pathname.startsWith('/admin')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    const tokenRole = token?.role ? String(token.role).toUpperCase() : undefined;

    if (pathname.startsWith('/user')) {
      if (!token) {
        return NextResponse.redirect(new URL('/signin', request.url));
      }

      if (tokenRole === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }

    if (pathname.startsWith('/admin')) {
      if (!token) {
        return NextResponse.redirect(new URL('/signin', request.url));
      }

      if (tokenRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/user', request.url));
      }
    }
  }

  const existing = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (isAppLocale(existing)) {
    return NextResponse.next();
  }

  const headerLocale = pickLocaleFromAcceptLanguage(request.headers.get('accept-language'));
  const locale = isAppLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;

  const response = NextResponse.next();
  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365
  });

  return response;
}

export const runtime = 'nodejs';
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
