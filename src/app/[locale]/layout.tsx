import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Analytics } from '@vercel/analytics/react';
import Script from 'next/script';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import Providers from './providers';
import LayoutShell from './components/LayoutShell';
import { buildOrganizationJsonLd, generatePageMetadata } from '@/lib/seo';
import {
  getLocaleDirection,
  isValidLocale,
  loadMessages,
  type AppLocale,
} from '@/lib/i18n';
import { loadArticles, loadListings } from '@/lib/data/loaders';
import { createStaticKey } from '@/lib/swr-config';

export async function generateStaticParams() {
  return ['th', 'en', 'zh-CN', 'zh-TW', 'my', 'ru'].map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  return generatePageMetadata({
    locale: locale as AppLocale,
    pathname: '/',
    title: 'ZomZom Property',
    description:
      'Boutique multilingual real estate experts guiding global buyers across Southeast Asia.',
  });
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  unstable_setRequestLocale(locale);

  const [{ messages }, listings, articles, tNav, tFooter] = await Promise.all([
    loadMessages(locale),
    loadListings(),
    loadArticles(),
    getTranslations({ locale, namespace: 'nav' }),
    getTranslations({ locale, namespace: 'footer' }),
  ]);

  const fallback = {
    [createStaticKey('listings')]: listings.items,
    [createStaticKey('articles')]: articles.items,
  } satisfies Record<string, unknown>;

  const navItems = [
    { label: tNav('home'), href: `/${locale}` },
    { label: tNav('listings'), href: `/${locale}/listings` },
    { label: tNav('articles'), href: `/${locale}/articles` },
    { label: tNav('contact'), href: `/${locale}/contact` },
  ];

  const footer = {
    tagline: tFooter('tagline'),
    legal: tFooter('legal'),
    nav: navItems,
  };

  const jsonLd = JSON.stringify(buildOrganizationJsonLd(locale as AppLocale));

  return (
    <html lang={locale} dir={getLocaleDirection(locale)}>
      <body className="bg-slate-50 text-slate-900">
        <Providers locale={locale} messages={messages} fallback={fallback}>
          <Suspense fallback={null}>
            <LayoutShell
              navItems={navItems}
              footer={footer}
              sectionIds={['hero', 'listings', 'articles', 'contact']}
            >
              <Script id="org-jsonld" type="application/ld+json">
                {jsonLd}
              </Script>
              {children}
            </LayoutShell>
          </Suspense>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
