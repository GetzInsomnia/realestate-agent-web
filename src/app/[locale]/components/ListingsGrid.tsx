'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import useSWR from 'swr';
import { useLocale, useTranslations } from 'next-intl';
import type { Listing } from '@/lib/data/schemas';
import type { AppLocale } from '@/lib/i18n';
import { createStaticKey } from '@/lib/swr-config';
import { formatCurrency } from '@/lib/utils';

const LISTINGS_KEY = createStaticKey('listings');

type Props = {
  initial: Listing[];
  sectionTitle: string;
  sectionSubtitle: string;
  viewAllLabel?: string;
  viewAllHref?: string;
  tagLabels: Record<string, string>;
  metrics: {
    bedrooms: string;
    bathrooms: string;
    area: string;
  };
  locale?: AppLocale;
  query?: string | null;
  tag?: string | null;
};

export default function ListingsGrid({
  initial,
  sectionTitle,
  sectionSubtitle,
  viewAllHref,
  viewAllLabel,
  tagLabels,
  metrics,
  locale,
  query,
  tag,
}: Props) {
  const localeFromContext = useLocale();
  const resolvedLocale = locale ?? (localeFromContext as AppLocale);
  const t = useTranslations();
  const { data } = useSWR<Listing[]>(LISTINGS_KEY, { fallbackData: initial });
  const listings = data ?? initial;
  const normalizedQuery = query?.trim().toLocaleLowerCase(resolvedLocale) ?? '';
  const normalizedTag = tag?.trim().toLowerCase() ?? '';

  const filteredListings = useMemo(() => {
    if (!normalizedQuery && !normalizedTag) {
      return listings;
    }

    return listings.filter((listing) => {
      const matchesTag =
        !normalizedTag ||
        listing.tags.some((listingTag) => listingTag.toLowerCase() === normalizedTag);

      if (!matchesTag) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableText = [
        listing.titleKey,
        listing.descriptionKey,
        listing.locationKey,
      ]
        .map((key) => t(key).toLocaleLowerCase(resolvedLocale))
        .join(' ');

      return searchableText.includes(normalizedQuery);
    });
  }, [listings, normalizedQuery, normalizedTag, resolvedLocale, t]);

  const showViewAll = Boolean(viewAllHref && viewAllLabel);

  return (
    <section id="listings" className="section-gradient scroll-mt-24 py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              {sectionTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">{sectionSubtitle}</p>
          </div>
          {showViewAll ? (
            <Link
              href={viewAllHref}
              className="inline-flex items-center rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:border-brand-300 hover:text-brand-700"
            >
              {viewAllLabel}
            </Link>
          ) : null}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {filteredListings.map((listing) => (
            <article
              key={listing.id}
              id={listing.id}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 shadow-soft transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-300 via-brand-500 to-brand-400 opacity-0 transition group-hover:opacity-100" />
              <div className="flex flex-col gap-4 p-6">
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600"
                    >
                      {tagLabels[tag] ?? t(tag)}
                    </span>
                  ))}
                </div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {t(listing.titleKey)}
                </h3>
                <p className="text-sm text-slate-600">{t(listing.descriptionKey)}</p>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>{t(listing.locationKey)}</span>
                  <span className="font-semibold text-brand-600">
                    {formatCurrency(listing.price, resolvedLocale, listing.currency)}
                  </span>
                </div>
                <dl className="grid grid-cols-3 gap-3 text-center text-xs text-slate-500">
                  <div className="rounded-lg border border-slate-200/60 bg-white/70 p-2">
                    <dt className="font-semibold text-slate-700">{listing.bedrooms}</dt>
                    <dd>{metrics.bedrooms}</dd>
                  </div>
                  <div className="rounded-lg border border-slate-200/60 bg-white/70 p-2">
                    <dt className="font-semibold text-slate-700">{listing.bathrooms}</dt>
                    <dd>{metrics.bathrooms}</dd>
                  </div>
                  <div className="rounded-lg border border-slate-200/60 bg-white/70 p-2">
                    <dt className="font-semibold text-slate-700">{listing.area} m²</dt>
                    <dd>{metrics.area}</dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
