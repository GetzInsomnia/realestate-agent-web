// src/lib/i18n.ts
import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';

// ----- Locales -----
export const locales = ['th', 'en', 'zh-CN', 'zh-TW', 'my', 'ru'] as const;
export type AppLocale = (typeof locales)[number];
export const DEFAULT_LOCALE: AppLocale = 'en';

export function isValidLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}

// ----- Labels & Direction -----
const LOCALE_LABELS: Record<AppLocale, string> = {
  en: 'English',
  th: 'ไทย',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  my: 'မြန်မာ',
  ru: 'Русский',
};

export function getLocaleLabel(locale: AppLocale): string {
  return LOCALE_LABELS[locale];
}

// ถ้ามีภาษา RTL ให้เพิ่มไว้ในอาร์เรย์นี้ เช่น: const RTL_LOCALES = ['ar','he'] as const;
const RTL_LOCALES: readonly AppLocale[] = [];
export function getLocaleDirection(locale: AppLocale): 'ltr' | 'rtl' {
  return RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';
}

// ----- Routing config (ใช้กับ middleware & SEO) -----
export const routing = {
  locales: [...locales],
  defaultLocale: DEFAULT_LOCALE,
  // 'as-needed' = ภาษา default ไม่ต้องมี prefix (/about), ที่เหลือมี (/th/about)
  localePrefix: 'as-needed' as const,
};

// ----- Fallback -----
export function fallbackLocale(): AppLocale {
  return DEFAULT_LOCALE;
}

// ----- next-intl server config -----
export default getRequestConfig(async ({ locale }) => {
  const active = isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  let messages: AbstractIntlMessages;
  try {
    messages = (await import(`../messages/${active}.json`)).default;
  } catch {
    messages = (await import(`../messages/${DEFAULT_LOCALE}.json`)).default;
  }

  return {
    locale: active,
    messages,
    // ตั้ง timezone ที่นี่ (เปลี่ยนได้หรือส่งผ่าน .env: NEXT_PUBLIC_DEFAULT_TZ)
    timeZone: process.env.NEXT_PUBLIC_DEFAULT_TZ || 'Asia/Bangkok',
  };
});
