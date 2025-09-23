import type { Metadata } from "next";
import { getHreflangLocales, routing, type AppLocale } from "@/lib/i18n";
import type { Listing } from "@/lib/data/schemas";

const SITE_NAME = "ZomZom Property";
const DEFAULT_DESCRIPTION =
  "Boutique multilingual real estate advisory helping global buyers secure premium Southeast Asian residences.";
const DEFAULT_KEYWORDS = [
  "real estate",
  "Thailand property",
  "investment",
  "luxury homes",
  "multilingual agents",
];

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://zomzomproperty.com";
}

export function getAbsoluteUrl(pathname = "/") {
  const base = getSiteUrl().replace(/\/$/, "");
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${path}`;
}

export function createRootMetadata(): Metadata {
  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: `${SITE_NAME} · ${DEFAULT_DESCRIPTION}`,
      template: `%s · ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
    authors: [{ name: SITE_NAME }],
    openGraph: {
      type: "website",
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      url: getSiteUrl(),
      siteName: SITE_NAME,
      locale: routing.defaultLocale,
      alternateLocale: routing.locales.filter((locale) => locale !== routing.defaultLocale),
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
    },
    category: "real estate",
    icons: {
      icon: "/icon.svg",
    },
  } satisfies Metadata;
}

export function createPageMetadata({
  locale,
  title,
  description = DEFAULT_DESCRIPTION,
  pathname = "",
  keywords = DEFAULT_KEYWORDS,
}: {
  locale: AppLocale;
  title: string;
  description?: string;
  pathname?: string;
  keywords?: string[];
}): Metadata {
  const alternates = getHreflangLocales(locale, pathname);
  const absolute = getAbsoluteUrl(`/${locale}${pathname}`.replace(/\/{2,}/g, "/"));

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: absolute,
      languages: alternates,
    },
    openGraph: {
      title,
      description,
      url: absolute,
      type: "article",
      siteName: SITE_NAME,
      locale,
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
    },
  } satisfies Metadata;
}

export const generatePageMetadata = createPageMetadata;

export function buildOrganizationJsonLd(locale: AppLocale) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: getAbsoluteUrl(`/${locale}`),
    areaServed: routing.locales,
    logo: getAbsoluteUrl("/logo.svg"),
    sameAs: [
      "https://www.facebook.com/zomzomproperty",
      "https://www.instagram.com/zomzomproperty",
    ],
  };
}

export function buildListingJsonLd(locale: AppLocale, listing: Listing) {
  return {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: listing.titleKey,
    description: listing.descriptionKey,
    numberOfRooms: listing.bedrooms,
    url: getAbsoluteUrl(`/${locale}/listings#${listing.id}`),
    floorSize: {
      "@type": "QuantitativeValue",
      value: listing.area,
      unitCode: "MTK",
    },
    price: listing.price,
    currency: listing.currency,
  };
}
