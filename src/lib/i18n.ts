// src/lib/i18n.ts
import {getRequestConfig} from 'next-intl/server';
import {createTranslator, type AbstractIntlMessages} from 'next-intl';
import {notFound} from 'next/navigation';

// ---- Locales ---------------------------------------------------------------

export const locales = ['th', 'en', 'zh-CN', 'zh-TW', 'my', 'ru'] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'en';
export const fallbackLocale: AppLocale = defaultLocale;

export function isValidLocale(input: unknown): input is AppLocale {
  return typeof input === 'string' && (locales as readonly string[]).includes(input);
}

export function getLocaleDirection(_locale: AppLocale): 'ltr' | 'rtl' {
  // ปัจจุบันทุกภาษาเป็น LTR
  return 'ltr';
}

export function getLocaleLabel(locale: AppLocale): string {
  const labels: Record<AppLocale, string> = {
    th: 'ไทย',
    en: 'English',
    'zh-CN': '简体中文',
    'zh-TW': '繁體中文',
    my: 'မြန်မာ',
    ru: 'Русский'
  };
  return labels[locale] ?? locale;
}

// ---- Helpers ---------------------------------------------------------------

function stripLeadingLocale(pathname: string): string {
  // ตัด '/en', '/th', ... ออก เพื่อใช้คำนวณ hreflang
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length > 0 && (locales as readonly string[]).includes(parts[0])) {
    parts.shift();
  }
  return '/' + parts.join('/');
}

// `hreflang` สำหรับ Next Metadata alternates.languages
export function getHreflangLocales(active: AppLocale, pathname = '/'): Record<string, string> {
  const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const basePath = stripLeadingLocale(clean);
  const pathPart = basePath === '/' ? '' : basePath;

  // ทำให้ param 'active' ถูกใช้งานจริง ป้องกัน ESLint unused
  const map: Record<string, string> = {
    [active]: `/${active}${pathPart}`
  };

  for (const l of locales) {
    if (l !== active) map[l] = `/${l}${pathPart}`;
  }
  // ตามสเปค SEO ให้ x-default ชี้ไป defaultLocale
  map['x-default'] = `/${defaultLocale}${pathPart}`;
  return map;
}

// โหลดไฟล์ข้อความตาม locale (คืนทั้ง locale ที่ใช้จริง + messages + timeZone)
export async function loadMessages(
  localeLike: string
): Promise<{locale: AppLocale; messages: AbstractIntlMessages; timeZone?: string}> {
  const locale: AppLocale = isValidLocale(localeLike) ? (localeLike as AppLocale) : fallbackLocale;
  const messages = (await import(`../messages/${locale}.json`)).default as AbstractIntlMessages;
  const timeZone = process.env.INTL_DEFAULT_TIME_ZONE || 'Asia/Bangkok';
  return {locale, messages, timeZone};
}

// สำหรับ unit tests/SSR ใช้สร้าง translator ได้ง่าย
export async function createAppTranslator(localeLike: string) {
  const {locale, messages, timeZone} = await loadMessages(localeLike);
  return createTranslator({locale, messages, timeZone});
}

// สำหรับ next-intl middleware
export const routing = {
  locales: [...locales],
  defaultLocale
};

// ---- next-intl request config (App Router) --------------------------------

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale; // ✅ ไม่ใช้พารามิเตอร์ 'locale' ที่ deprecated แล้ว
  if (!isValidLocale(requested)) {
    // ถ้า path ไม่ใช่ภาษาในระบบ => 404 (กันการ gen หน้าเพี้ยน)
    notFound();
  }
  const locale = requested as AppLocale;
  const {messages, timeZone} = await loadMessages(locale);
  return {locale, messages, timeZone};
});
