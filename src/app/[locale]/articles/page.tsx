import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Script from 'next/script';
import Link from 'next/link';
import Breadcrumbs from '../components/Breadcrumbs';
import { loadArticles } from '@/lib/data/loaders';
import { formatDate } from '@/lib/utils';
import { createPageMetadata, getAbsoluteUrl } from '@/lib/seo';
import type { AppLocale } from '@/lib/i18n';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'articles' });
  return createPageMetadata({
    locale: locale as AppLocale,
    title: t('seo.title'),
    description: t('seo.description'),
    pathname: '/articles',
  });
}

export default async function ArticlesPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const [tArticles, articles] = await Promise.all([
    getTranslations({ locale, namespace: 'articles' }),
    loadArticles(),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: tArticles('sectionTitle'),
    itemListElement: articles.items.map((article, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: getAbsoluteUrl(`/${locale}/articles/${article.slug}`),
      name: tArticles(`items.${article.id}.title`),
    })),
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <Breadcrumbs />
      <header className="mt-8 space-y-3">
        <h1 className="text-3xl font-semibold text-slate-900">
          {tArticles('sectionTitle')}
        </h1>
        <p className="text-sm text-slate-600">{tArticles('sectionSubtitle')}</p>
      </header>
      <div className="mt-10 space-y-8">
        {articles.items.map((article) => (
          <article
            key={article.id}
            className="rounded-3xl border border-slate-200/60 bg-white/80 p-6 shadow-soft"
          >
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-brand-500">
              <span>{formatDate(article.published, locale)}</span>
              <span>·</span>
              <span>{tArticles('readTime', { minutes: article.readingMinutes })}</span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-900">
              {tArticles(`items.${article.id}.title`)}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {tArticles(`items.${article.id}.excerpt`)}
            </p>
            <Link
              href={`/${locale}/articles/${article.slug}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition hover:text-brand-500"
            >
              {tArticles('readMore')}
              <span aria-hidden>→</span>
            </Link>
          </article>
        ))}
      </div>
      <Script id="articles-jsonld" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>
    </div>
  );
}
