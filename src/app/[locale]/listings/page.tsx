import type { Metadata } from 'next';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';
import Skeleton from '@/components/ui/Skeleton';
import { loadListings } from '@/lib/data/loaders';
import { buildListingJsonLd, createPageMetadata } from '@/lib/seo';
import { fallbackLocale, isValidLocale, locales, type AppLocale } from '@/lib/i18n';

const Breadcrumbs = dynamic(() => import('../components/Breadcrumbs'), {
  loading: () => <Skeleton className="h-4 w-40" />,
});

const ListingsSearchClient = dynamic(() => import('./ListingsSearchClient'), {
  loading: () => (
    <div className="mt-8 space-y-6">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-[420px] w-full" />
    </div>
  ),
});

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale?: string };
}): Promise<Metadata> {
  const requestedLocale = params?.locale ?? '';
  const resolvedLocale = isValidLocale(requestedLocale)
    ? requestedLocale
    : fallbackLocale;
  const locale = resolvedLocale as AppLocale;
  const t = await getTranslations({ locale, namespace: 'listings' });
  return createPageMetadata({
    locale,
    title: t('seo.title'),
    description: t('seo.description'),
    pathname: '/listings',
  });
}

export default async function ListingsPage({ params }: { params: { locale?: string } }) {
  const requestedLocale = params?.locale ?? '';
  const resolvedLocale = isValidLocale(requestedLocale)
    ? requestedLocale
    : fallbackLocale;
  const locale = resolvedLocale as AppLocale;
  const [tListings, listings] = await Promise.all([
    getTranslations({ locale, namespace: 'listings' }),
    loadListings(),
  ]);

  const listingJsonLd = listings.items.map((listing) =>
    buildListingJsonLd(locale, listing),
  );

  const tagLabels = {
    panoramic: tListings('tags.panoramic'),
    cityCore: tListings('tags.cityCore'),
    resortLiving: tListings('tags.resortLiving'),
    turnkey: tListings('tags.turnkey'),
    investmentReady: tListings('tags.investmentReady'),
    transit: tListings('tags.transit'),
    exclusive: tListings('tags.exclusive'),
    privateDock: tListings('tags.privateDock'),
  } satisfies Record<string, string>;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <Breadcrumbs />
      <div className="mt-8 space-y-4">
        <h1 className="text-3xl font-semibold text-slate-900">
          {tListings('sectionTitle')}
        </h1>
        <p className="text-sm text-slate-600">{tListings('directorySubtitle')}</p>
      </div>
      <ListingsSearchClient
        locale={locale as AppLocale}
        initial={listings.items}
        sectionTitle={tListings('sectionTitle')}
        sectionSubtitle={tListings('directorySubtitle')}
        tagLabels={tagLabels}
        metrics={{
          bedrooms: tListings('metrics.bedrooms'),
          bathrooms: tListings('metrics.bathrooms'),
          area: tListings('metrics.area'),
        }}
      />
      <Script id="listings-directory-jsonld" type="application/ld+json">
        {JSON.stringify(listingJsonLd)}
      </Script>
    </div>
  );
}
