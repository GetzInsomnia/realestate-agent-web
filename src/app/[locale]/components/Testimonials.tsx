'use client';

import { useTranslations } from 'next-intl';
import type { Testimonial } from '@/lib/data/schemas';

export default function Testimonials({
  testimonials,
  sectionTitle,
  sectionSubtitle,
}: {
  testimonials: Testimonial[];
  sectionTitle: string;
  sectionSubtitle: string;
}) {
  const t = useTranslations();

  return (
    <section className="py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 text-center sm:px-6 lg:px-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            {sectionTitle}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{sectionSubtitle}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((item) => (
            <figure key={item.id} className="fade-surface h-full text-left">
              <blockquote className="text-sm text-slate-600">
                “{t(item.quoteKey)}”
              </blockquote>
              <figcaption className="mt-4 text-sm font-semibold text-slate-900">
                {t(item.nameKey)}
                <span className="ml-2 text-xs font-normal text-slate-500">
                  {t(item.roleKey)}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
