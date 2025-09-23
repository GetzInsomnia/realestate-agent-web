import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { fallbackLocale, isValidLocale, locales } from '@/lib/i18n';

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleNotFound({
  params,
}: {
  params: { locale?: string };
}) {
  const requestedLocale = params?.locale ?? '';
  const locale = isValidLocale(requestedLocale) ? requestedLocale : fallbackLocale;
  const t = await getTranslations({ locale, namespace: 'errors' });

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">{t('notFoundTitle')}</h1>
        <p className="text-sm text-slate-600">{t('notFoundDescription')}</p>
      </div>
      <Link
        href={`/${locale}`}
        className="rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
      >
        {t('backHome')}
      </Link>
    </div>
  );
}
