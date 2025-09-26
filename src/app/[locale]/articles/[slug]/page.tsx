import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';
import Skeleton from '@/components/ui/Skeleton';
import { loadArticles } from '@/lib/data/loaders';
import { formatDate } from '@/lib/utils';
import { createPageMetadata, getAbsoluteUrl } from '@/lib/seo';
import { fallbackLocale, isValidLocale, locales, type AppLocale } from '@/lib/i18n';

const Breadcrumbs = dynamic(() => import('../../components/Breadcrumbs'), {
  loading: () => <Skeleton className="h-4 w-40" />,
});

const stripArticlesNs = (key: string) =>
  key.startsWith('articles.') ? key.replace(/^articles\./, '') : key;

export const dynamicParams = false;

export function generateStaticParams() {
  const articles = loadArticles();
  return locales.flatMap((locale) =>
    articles.items.map((article) => ({ locale, slug: article.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale?: string; slug: string };
}): Promise<Metadata> {
  const requestedLocale = params?.locale ?? '';
  const locale = isValidLocale(requestedLocale) ? requestedLocale : fallbackLocale;
  const appLocale = locale as AppLocale;
  const { slug } = params;
  const articles = loadArticles();
  const article = articles.items.find((item) => item.slug === slug);
  if (!article) {
    return createPageMetadata({
      locale: appLocale,
      title: 'Article',
      description: '',
      pathname: `/articles/${slug}`,
    });
  }
  const tArticles = await getTranslations({ locale, namespace: 'articles' });
  return createPageMetadata({
    locale: appLocale,
    title: tArticles(stripArticlesNs(article.titleKey)),
    description: tArticles(stripArticlesNs(article.excerptKey)),
    pathname: `/articles/${article.slug}`,
  });
}

export default async function ArticleDetail({
  params,
}: {
  params: { locale?: string; slug: string };
}) {
  const requestedLocale = params?.locale ?? '';
  const locale = isValidLocale(requestedLocale) ? requestedLocale : fallbackLocale;
  const { slug } = params;
  const articles = loadArticles();
  const article = articles.items.find((item) => item.slug === slug);
  if (!article) {
    notFound();
  }

  const tArticles = await getTranslations({ locale, namespace: 'articles' });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: tArticles(stripArticlesNs(article.titleKey)),
    description: tArticles(stripArticlesNs(article.excerptKey)),
    datePublished: article.published,
    url: getAbsoluteUrl(`/${locale}/articles/${article.slug}`),
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Breadcrumbs />
      <article className="mt-8 space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
            {formatDate(article.published, locale)} ·{' '}
            {tArticles('readTime', { minutes: article.readingMinutes })}
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            {tArticles(stripArticlesNs(article.titleKey))}
          </h1>
          <p className="text-sm text-slate-600">
            {tArticles(stripArticlesNs(article.excerptKey))}
          </p>
        </header>
        <div className="prose prose-slate max-w-none text-sm leading-relaxed">
          {article.bodyKeys.map((key) => (
            <p key={key}>{tArticles(stripArticlesNs(key))}</p>
          ))}
        </div>
      </article>
      <Script id={`article-${article.id}-jsonld`} type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>
    </div>
  );
}
