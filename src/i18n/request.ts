import {getRequestConfig} from 'next-intl/server';
import {cookies, headers} from 'next/headers';
import {DEFAULT_LOCALE, isAppLocale, LOCALE_COOKIE_NAME} from './locales';

function pickLocaleFromAcceptLanguage(acceptLanguage: string | null): string | null {
  if (!acceptLanguage) return null;

  // Very small parser: "fr-FR,fr;q=0.9,en;q=0.8"
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

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  const headerStore = await headers();
  const headerLocale = pickLocaleFromAcceptLanguage(headerStore.get('accept-language'));

  const locale = isAppLocale(cookieLocale) ? cookieLocale : (isAppLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE);

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
