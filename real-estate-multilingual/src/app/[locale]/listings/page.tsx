import type { Metadata } from "next";
import Script from "next/script";
import { getTranslations } from "next-intl/server";
import Breadcrumbs from "../components/Breadcrumbs";
import { loadListings } from "@/lib/data/loaders";
import { formatCurrency } from "@/lib/utils";
import type { AppLocale } from "@/lib/i18n";
import { buildListingJsonLd, createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "listings" });
  return createPageMetadata({
    locale: locale as AppLocale,
    title: t("seo.title"),
    description: t("seo.description"),
    pathname: "/listings",
  });
}

export default async function ListingsPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const [tCommon, tListings, listings] = await Promise.all([
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "listings" }),
    loadListings(),
  ]);

  const listingJsonLd = listings.items.map((listing) => buildListingJsonLd(locale as AppLocale, listing));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <Breadcrumbs
        homeLabel={tCommon("home")}
        homeHref={`/${locale}`}
        items={[{ label: tListings("sectionTitle") }]}
      />
      <div className="mt-8 space-y-4">
        <h1 className="text-3xl font-semibold text-slate-900">{tListings("sectionTitle")}</h1>
        <p className="text-sm text-slate-600">{tListings("directorySubtitle")}</p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {listings.items.map((listing) => (
          <article key={listing.id} className="fade-surface h-full">
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-brand-500">
              {listing.tags.map((tag) => (
                <span key={tag}>{tListings(`tags.${tag}`)}</span>
              ))}
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">{tListings(`items.${listing.id}.title`)}</h2>
            <p className="mt-2 text-sm text-slate-600">{tListings(`items.${listing.id}.description`)}</p>
            <dl className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-slate-500">
              <div className="rounded-lg border border-slate-200/60 bg-white/70 p-2">
                <dt className="font-semibold text-slate-700">{listing.bedrooms}</dt>
                <dd>{tListings("metrics.bedrooms")}</dd>
              </div>
              <div className="rounded-lg border border-slate-200/60 bg-white/70 p-2">
                <dt className="font-semibold text-slate-700">{listing.bathrooms}</dt>
                <dd>{tListings("metrics.bathrooms")}</dd>
              </div>
              <div className="rounded-lg border border-slate-200/60 bg-white/70 p-2">
                <dt className="font-semibold text-slate-700">{listing.area} m²</dt>
                <dd>{tListings("metrics.area")}</dd>
              </div>
            </dl>
            <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
              <span>{tListings(`items.${listing.id}.location`)}</span>
              <span className="font-semibold text-brand-600">
                {formatCurrency(listing.price, locale, listing.currency)}
              </span>
            </div>
          </article>
        ))}
      </div>
      <Script id="listings-directory-jsonld" type="application/ld+json">
        {JSON.stringify(listingJsonLd)}
      </Script>
    </div>
  );
}
