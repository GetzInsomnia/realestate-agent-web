'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getAbsoluteUrl } from '@/lib/seo';
import type { Article } from '@/lib/data/schemas';
import articles from '@/lib/data/articles.json';

type Breadcrumb = {
  label: string;
  href?: string;
  fullPath: string;
};

const articleSlugToTitleKey = new Map(
  (articles as Article[]).map((article) => [article.slug, article.titleKey]),
);

function stripNamespace(key: string, namespace: string) {
  const prefix = `${namespace}.`;
  return key.startsWith(prefix) ? key.slice(prefix.length) : key;
}

function formatSegment(segment: string) {
  return decodeURIComponent(segment)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const locale = useLocale();
  const tCommon = useTranslations('common');
  const tListings = useTranslations('listings');
  const tArticles = useTranslations('articles');
  const tContact = useTranslations('contact');

  const breadcrumbs = useMemo<Breadcrumb[]>(() => {
    if (!pathname) {
      return [];
    }

    const segments = pathname.split('/').filter(Boolean);
    const localeIndex = segments.indexOf(locale);
    const pathSegments = localeIndex === -1 ? segments : segments.slice(localeIndex + 1);

    const items: Breadcrumb[] = [];
    const homePath = `/${locale}`;
    const hasSegments = pathSegments.length > 0;

    items.push({
      label: tCommon('home'),
      href: hasSegments ? homePath : undefined,
      fullPath: homePath,
    });

    pathSegments.forEach((segment, index) => {
      const isLast = index === pathSegments.length - 1;
      const fullPath = `/${[locale, ...pathSegments.slice(0, index + 1)].join('/')}`;

      const label = (() => {
        if (segment === 'listings') {
          return tListings('sectionTitle');
        }
        if (segment === 'articles') {
          return tArticles('sectionTitle');
        }
        if (segment === 'contact') {
          return tContact('title');
        }

        const articleTitleKey = articleSlugToTitleKey.get(segment);
        if (articleTitleKey) {
          return tArticles(stripNamespace(articleTitleKey, 'articles'));
        }

        return formatSegment(segment);
      })();

      items.push({
        label,
        href: isLast ? undefined : fullPath,
        fullPath,
      });
    });

    return items;
  }, [locale, pathname, tArticles, tCommon, tContact, tListings]);

  const breadcrumbJsonLd = useMemo(() => {
    if (breadcrumbs.length === 0) {
      return null;
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((breadcrumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: breadcrumb.label,
        item: getAbsoluteUrl(breadcrumb.fullPath),
      })),
    };
  }, [breadcrumbs]);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap items-center gap-2 text-slate-500">
          {breadcrumbs.map((breadcrumb, index) => {
            const isFirst = index === 0;
            const isLast = index === breadcrumbs.length - 1;

            return (
              <li key={breadcrumb.fullPath} className="flex items-center gap-2">
                {!isFirst && <span className="text-slate-400">/</span>}
                {breadcrumb.href ? (
                  <Link
                    href={breadcrumb.href}
                    className={cn(
                      'font-medium text-slate-600 transition hover:text-brand-600',
                      { 'text-slate-800': isLast },
                    )}
                  >
                    {breadcrumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-800">{breadcrumb.label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      {breadcrumbJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbJsonLd),
          }}
        />
      ) : null}
    </>
  );
}
