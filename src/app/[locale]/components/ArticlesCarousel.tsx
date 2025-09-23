"use client";

import Link from "next/link";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import type { Article } from "@/lib/data/schemas";
import { createStaticKey } from "@/lib/swr-config";
import { formatDate } from "@/lib/utils";
import { useLocale } from "next-intl";

const ARTICLES_KEY = createStaticKey("articles");

type Props = {
  initial: Article[];
  sectionTitle: string;
  sectionSubtitle: string;
  viewAllHref: string;
  viewAllLabel: string;
};

export default function ArticlesCarousel({
  initial,
  sectionTitle,
  sectionSubtitle,
  viewAllHref,
  viewAllLabel,
}: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const { data } = useSWR<Article[]>(ARTICLES_KEY, { fallbackData: initial });
  const articles = data ?? initial;

  return (
    <section id="articles" className="scroll-mt-24 py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{sectionTitle}</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">{sectionSubtitle}</p>
          </div>
          <Link
            href={viewAllHref}
            className="inline-flex items-center rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            {viewAllLabel}
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {articles.map((article) => (
            <article
              key={article.id}
              className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200/60 bg-white/80 p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="space-y-1 text-xs font-medium uppercase tracking-wide text-brand-500">
                <span>{formatDate(article.published, locale)}</span>
                <span>·</span>
                <span>{t("articles.readTime", { minutes: article.readingMinutes })}</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{t(article.titleKey)}</h3>
              <p className="flex-1 text-sm text-slate-600">{t(article.excerptKey)}</p>
              <Link
                href={`${viewAllHref}/${article.slug}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition hover:text-brand-500"
              >
                {t("articles.readMore")}
                <span aria-hidden>→</span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
