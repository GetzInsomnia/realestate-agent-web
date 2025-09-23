import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { getTranslations } from "next-intl/server";
import Breadcrumbs from "../../components/Breadcrumbs";
import { loadArticles } from "@/lib/data/loaders";
import { formatDate } from "@/lib/utils";
import { createPageMetadata, getAbsoluteUrl } from "@/lib/seo";
import type { AppLocale } from "@/lib/i18n";

export async function generateStaticParams() {
  const articles = loadArticles();
  return articles.items.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const { locale, slug } = params;
  const articles = loadArticles();
  const article = articles.items.find((item) => item.slug === slug);
  if (!article) {
    return createPageMetadata({
      locale: locale as AppLocale,
      title: "Article",
      description: "",
      pathname: `/articles/${slug}`,
    });
  }
  const t = await getTranslations({ locale, namespace: "articles" });
  return createPageMetadata({
    locale: locale as AppLocale,
    title: t(`items.${article.id}.title`),
    description: t(`items.${article.id}.excerpt`),
    pathname: `/articles/${article.slug}`,
  });
}

export default async function ArticleDetail({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const { locale, slug } = params;
  const articles = loadArticles();
  const article = articles.items.find((item) => item.slug === slug);
  if (!article) {
    notFound();
  }

  const [tCommon, tArticles] = await Promise.all([
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "articles" }),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: tArticles(`items.${article.id}.title`),
    description: tArticles(`items.${article.id}.excerpt`),
    datePublished: article.published,
    url: getAbsoluteUrl(`/${locale}/articles/${article.slug}`),
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Breadcrumbs
        homeLabel={tCommon("home")}
        homeHref={`/${locale}`}
        items={[
          { label: tArticles("sectionTitle"), href: `/${locale}/articles` },
          { label: tArticles(`items.${article.id}.title`) },
        ]}
      />
      <article className="mt-8 space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
            {formatDate(article.published, locale)} · {tArticles("readTime", { minutes: article.readingMinutes })}
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">{tArticles(`items.${article.id}.title`)}</h1>
          <p className="text-sm text-slate-600">{tArticles(`items.${article.id}.excerpt`)}</p>
        </header>
        <div className="prose prose-slate max-w-none text-sm leading-relaxed">
          {article.bodyKeys.map((key) => (
            <p key={key}>{tArticles(key)}</p>
          ))}
        </div>
      </article>
      <Script id={`article-${article.id}-jsonld`} type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>
    </div>
  );
}
