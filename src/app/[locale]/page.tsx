import Script from 'next/script';
import { getTranslations } from 'next-intl/server';
import Hero from './components/Hero';
import ListingsGrid from './components/ListingsGrid';
import ArticlesCarousel from './components/ArticlesCarousel';
import Testimonials from './components/Testimonials';
import FaqAccordion from './components/FaqAccordion';
import { JsonLd, buildListingJsonLd, ldOrganization, ldWebsite } from '@/lib/seo';
import {
  loadArticles,
  loadFaqs,
  loadHighlights,
  loadListings,
  loadTestimonials,
} from '@/lib/data/loaders';
import { fallbackLocale, isValidLocale, locales, type AppLocale } from '@/lib/i18n';

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleHome({ params }: { params: { locale?: string } }) {
  const requestedLocale = params?.locale ?? '';
  const locale = isValidLocale(requestedLocale) ? requestedLocale : fallbackLocale;
  const [
    tHome,
    tListings,
    tArticles,
    listings,
    articles,
    highlights,
    faqs,
    testimonials,
  ] = await Promise.all([
    getTranslations({ locale, namespace: 'home' }),
    getTranslations({ locale, namespace: 'listings' }),
    getTranslations({ locale, namespace: 'articles' }),
    loadListings(),
    loadArticles(),
    loadHighlights(),
    loadFaqs(),
    loadTestimonials(),
  ]);

  const heroHighlights = highlights.items.map((item) => ({
    value: item.value,
    label: tHome(
      item.labelKey.startsWith('home.')
        ? item.labelKey.slice('home.'.length)
        : item.labelKey
    ),
  }));

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

  const listingJsonLd = listings.items
    .slice(0, 2)
    .map((listing) => buildListingJsonLd(locale as AppLocale, listing));

  return (
    <>
      <JsonLd {...ldOrganization(locale as AppLocale)} />
      <JsonLd {...ldWebsite(locale as AppLocale)} />

      <Hero
        eyebrow={tHome('hero.eyebrow')}
        title={tHome('hero.title')}
        subtitle={tHome('hero.subtitle')}
        primaryCta={{ label: tHome('hero.ctaPrimary'), href: `/${locale}/contact` }}
        secondaryCta={{ label: tHome('hero.ctaSecondary'), href: `/${locale}/listings` }}
        highlights={heroHighlights}
      />

      {listings.issues && (
        <div className="mx-auto mt-6 w-full max-w-4xl rounded-3xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {tHome('alerts.listingsFallback')}
        </div>
      )}

      <ListingsGrid
        initial={listings.items.slice(0, 4)}
        sectionTitle={tListings('sectionTitle')}
        sectionSubtitle={tListings('sectionSubtitle')}
        viewAllHref={`/${locale}/listings`}
        viewAllLabel={tListings('viewAll')}
        tagLabels={tagLabels}
        metrics={{
          bedrooms: tListings('metrics.bedrooms'),
          bathrooms: tListings('metrics.bathrooms'),
          area: tListings('metrics.area'),
        }}
      />

      {articles.issues && (
        <div className="mx-auto w-full max-w-4xl rounded-3xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {tHome('alerts.articlesFallback')}
        </div>
      )}

      <ArticlesCarousel
        initial={articles.items.slice(0, 3)}
        sectionTitle={tArticles('sectionTitle')}
        sectionSubtitle={tArticles('sectionSubtitle')}
        viewAllHref={`/${locale}/articles`}
        viewAllLabel={tArticles('viewAll')}
      />

      <Testimonials
        testimonials={testimonials.items}
        sectionTitle={tHome('testimonials.title')}
        sectionSubtitle={tHome('testimonials.subtitle')}
      />

      <FaqAccordion
        faqs={faqs.items}
        sectionTitle={tHome('faq.title')}
        sectionSubtitle={tHome('faq.subtitle')}
      />

      <section id="contact" className="py-20">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 rounded-3xl bg-brand-600 px-6 py-16 text-center text-white shadow-soft">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            {tHome('contactCTA.title')}
          </h2>
          <p className="max-w-3xl text-sm text-brand-50/90">
            {tHome('contactCTA.subtitle')}
          </p>
          <a
            href={`/${locale}/contact`}
            className="inline-flex items-center rounded-full bg-white px-6 py-2 text-sm font-semibold text-brand-600 transition hover:bg-slate-100"
          >
            {tHome('contactCTA.cta')}
          </a>
        </div>
      </section>

      <Script id="listing-jsonld" type="application/ld+json">
        {JSON.stringify(listingJsonLd)}
      </Script>
    </>
  );
}
