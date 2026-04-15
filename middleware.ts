import {NextRequest, NextResponse} from 'next/server';
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

export function middleware(request: NextRequest) {
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

export const config = {
  matcher: [
    '/((?!api|_next|.*\\..*).*)'
  ]
};
