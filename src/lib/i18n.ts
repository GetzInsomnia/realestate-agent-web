import { getRequestConfig, requestLocale } from 'next-intl/server';
import { createTranslator, type AbstractIntlMessages } from 'next-intl';
import { notFound } from 'next/navigation';

export const locales = ['th', 'en', 'zh-CN', 'zh-TW', 'my', 'ru'] as const;
export type AppLocale = (typeof locales)[number];
export const fallbackLocale: AppLocale = 'en';

export const localeNames: Record<AppLocale, string> = {
  th: 'ไทย',
  en: 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  my: 'မြန်မာ',
  ru: 'Русский',
};

const rtlLocales = new Set<AppLocale>();

export const routing = {
  locales,
  defaultLocale: fallbackLocale,
  localePrefix: 'always' as const,
};

export function isValidLocale(locale: string): locale is AppLocale {
  return locales.includes(locale as AppLocale);
}

export async function loadMessages(
  locale: string,
): Promise<{ locale: AppLocale; messages: AbstractIntlMessages }> {
  const resolved = isValidLocale(locale) ? locale : fallbackLocale;
  try {
    const messages = (await import(`../messages/${resolved}.json`)).default;
    return { locale: resolved, messages } as const;
  } catch (error) {
    if (resolved !== fallbackLocale) {
      const fallback = await loadMessages(fallbackLocale);
      return fallback;
    }
    throw error;
  }
}

export async function createAppTranslator(locale: string) {
  const { messages, locale: resolved } = await loadMessages(locale);
  return createTranslator({ locale: resolved, messages });
}

export function getLocaleDirection(locale: string): 'ltr' | 'rtl' {
  if (isValidLocale(locale) && rtlLocales.has(locale)) {
    return 'rtl';
  }
  return 'ltr';
}

export function getLocaleLabel(locale: string) {
  if (isValidLocale(locale)) {
    return localeNames[locale];
  }
  return localeNames[fallbackLocale];
}

export function getHreflangLocales(current: AppLocale, pathname = '') {
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const normalizedPath = cleanPath.replace(/^\/[a-zA-Z-]+/, '');
  const basePath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  return Object.fromEntries(
    locales.map((locale) => [locale, `/${locale}${basePath === '/' ? '' : basePath}`]),
  );
}

export default getRequestConfig(async () => {
  const locale = await requestLocale();

  if (!locale || !isValidLocale(locale)) {
    notFound();
  }

  const { messages, locale: resolvedLocale } = await loadMessages(locale);

  return {
    locale: resolvedLocale,
    messages,
    timeZone: process.env.INTL_DEFAULT_TIME_ZONE || 'Asia/Bangkok',
  };
});
