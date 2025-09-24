// src/lib/i18n.ts
import { getRequestConfig } from 'next-intl/server';
import { createTranslator, type AbstractIntlMessages } from 'next-intl';
import { notFound } from 'next/navigation';

export const locales = ['th', 'en', 'zh-CN', 'zh-TW', 'my', 'ru'] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = 'en';

export function isValidLocale(input: string | null | undefined): input is AppLocale {
  return !!input && (locales as readonly string[]).includes(input);
}

function stripLeadingLocale(pathname: string) {
  const m = pathname.match(/^\/([A-Za-z-]+)(\/|$)/);
  if (m && (locales as readonly string[]).includes(m[1])) {
    return pathname.slice(m[0].length - 1) || '/';
  }
  return pathname || '/';
}

/**
 * คืนชุดลิงก์ hreflang สำหรับทุก locale + 'x-default'
 * key = hreflang code, value = absolute path
 */
export function getHreflangLocales(
  current: AppLocale,
  pathname = '/',
): Record<string, string> {
  const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const basePath = stripLeadingLocale(clean);
  const pathPart = basePath === '/' ? '' : basePath;

  const map: Record<string, string> = {};
  for (const l of locales) {
    map[l] = `/${l}${pathPart}`;
  }
  // x-default ชี้ไปที่ defaultLocale
  map['x-default'] = `/${defaultLocale}${pathPart}`;
  return map;
}

export async function loadMessages(
  locale: AppLocale,
): Promise<{ messages: AbstractIntlMessages; timeZone?: string }> {
  // จาก src/lib -> src/messages = ../messages
  const messages: AbstractIntlMessages = (await import(`../messages/${locale}.json`))
    .default;
  const timeZone = process.env.INTL_DEFAULT_TIME_ZONE || 'Asia/Bangkok';
  return { messages, timeZone };
}

export async function getTranslator(locale: AppLocale) {
  const { messages, timeZone } = await loadMessages(locale);
  return createTranslator({ locale, messages, timeZone });
}

// รูปแบบใหม่: รับ {requestLocale} จากพารามิเตอร์ แล้ว await
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  if (!isValidLocale(requested)) {
    notFound();
  }
  const locale = requested as AppLocale;
  const { messages, timeZone } = await loadMessages(locale);
  return { locale, messages, timeZone };
});
