import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import Breadcrumbs from '../components/Breadcrumbs';
import ContactForm, { type ContactCopy } from './ContactForm';
import { createPageMetadata } from '@/lib/seo';
import { fallbackLocale, isValidLocale, locales, type AppLocale } from '@/lib/i18n';

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? 'turnstile-site-key';

export async function generateMetadata({
  params,
}: {
  params: { locale?: string };
}): Promise<Metadata> {
  const requestedLocale = params?.locale ?? '';
  const locale = isValidLocale(requestedLocale) ? requestedLocale : fallbackLocale;
  const appLocale = locale as AppLocale;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return createPageMetadata({
    locale: appLocale,
    title: t('seo.title'),
    description: t('seo.description'),
    pathname: '/contact',
  });
}

export default async function ContactPage({ params }: { params: { locale?: string } }) {
  const requestedLocale = params?.locale ?? '';
  const locale = isValidLocale(requestedLocale) ? requestedLocale : fallbackLocale;
  const tContact = await getTranslations({ locale, namespace: 'contact' });

  const copy: ContactCopy = {
    intro: tContact('intro'),
    fields: {
      name: tContact('fields.name'),
      email: tContact('fields.email'),
      phone: tContact('fields.phone'),
      budget: tContact('fields.budget'),
      message: tContact('fields.message'),
    },
    submit: tContact('submit'),
    sending: tContact('sending'),
    success: tContact('success'),
    error: tContact('error'),
    cooldown: tContact('cooldown'),
    honeypot: tContact('honeypot'),
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <Suspense fallback={null}>
        <Breadcrumbs />
      </Suspense>
      <div className="mt-8 space-y-4">
        <h1 className="text-3xl font-semibold text-slate-900">{tContact('title')}</h1>
        <p className="text-sm text-slate-600">{tContact('subtitle')}</p>
      </div>
      <div className="mt-10 rounded-3xl border border-slate-200/60 bg-white/80 p-8 shadow-soft">
        <ContactForm locale={locale} copy={copy} turnstileSiteKey={TURNSTILE_SITE_KEY} />
      </div>
    </div>
  );
}
