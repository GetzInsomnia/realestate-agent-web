// src/lib/i18n.ts
import { getRequestConfig } from 'next-intl/server';
import { createTranslator, type AbstractIntlMessages } from 'next-intl';
import { notFound } from 'next/navigation';

// ---- Locales ---------------------------------------------------------------
export const locales = ['th', 'en', 'zh-CN', 'zh-TW', 'my', 'ru'] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = 'en';
export const fallbackLocale: AppLocale = defaultLocale;

export function isValidLocale(input: string | null | undefined): input is AppLocale {
  return !!input && (locales as readonly string[]).includes(input);
}

// Used by next-intl middleware & SEO helpers
export const routing = {
  locales: [...locales],
  defaultLocale,
  // Force /en,/th,... in URL soเราทำงานง่ายขึ้นกับ sitemap/SEO
  localePrefix: 'always' as const,
  // next-intl middleware expects this flag
  alternateLinks: true,
};

// ---- Hreflang helpers ------------------------------------------------------
function stripLeadingLocale(pathname: string) {
  const m = pathname.match(/^\/([A-Za-z-]+)(\/|$)/);
  if (m && (locales as readonly string[]).includes(m[1])) {
    return pathname.slice(m[0].length - 1) || '/';
  }
  return pathname || '/';
}

/**
 * คืนชุดลิงก์ hreflang สำหรับทุก locale + 'x-default'
 * key = hreflang code, value = absolute-ish path (ต่อ base เองใน SEO)
 */
export function getHreflangLocales(current: AppLocale, pathname = '/'): Record<string, string> {
  const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const basePath = stripLeadingLocale(clean);
  const pathPart = basePath === '/' ? '' : basePath;

  const map: Record<string, string> = {};
  for (const l of locales) {
    map[l] = `/${l}${pathPart}`;
  }
  // x-default ชี้ไป defaultLocale (ใช้ใน SEO metadata)
  map['x-default'] = `/${defaultLocale}${pathPart}`;
  return map;
}

// ---- UI helpers ------------------------------------------------------------
export function getLocaleDirection(_locale: AppLocale): 'ltr' | 'rtl' {
  // ทุกภาษาที่ใช้ตอนนี้เป็น LTR ทั้งหมด
  return 'ltr';
}

export function getLocaleLabel(locale: AppLocale): string {
  switch (locale) {
    case 'en':
      return 'English';
    case 'th':
      return 'ไทย';
    case 'zh-CN':
      return '简体中文';
    case 'zh-TW':
      return '繁體中文';
    case 'my':
      return 'မြန်မာ';
    case 'ru':
      return 'Русский';
    default:
      return String(locale);
  }
}

// ---- Messages / Translators -----------------------------------------------
export async function loadMessages(
  input: string | AppLocale,
): Promise<{ locale: AppLocale; messages: AbstractIntlMessages; timeZone?: string }> {
  const locale = isValidLocale(String(input)) ? (input as AppLocale) : fallbackLocale;
  const messages: AbstractIntlMessages = (await import(`../messages/${locale}.json`)).default;
  const timeZone = process.env.INTL_DEFAULT_TIME_ZONE || 'Asia/Bangkok';
  return { locale, messages, timeZone };
}

export async function getTranslator(locale: AppLocale) {
  const { messages, timeZone } = await loadMessages(locale);
  return createTranslator({ locale, messages, timeZone });
}

// for tests / simple usage
export async function createAppTranslator(locale: AppLocale) {
  return getTranslator(locale);
}

// ---- next-intl server config (App Router) ---------------------------------
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  if (!isValidLocale(requested)) {
    notFound();
  }
  const locale = requested as AppLocale;
  const { messages, timeZone } = await loadMessages(locale);
  return { locale, messages, timeZone };
});
