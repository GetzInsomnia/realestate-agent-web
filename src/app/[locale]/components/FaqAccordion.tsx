'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Faq } from '@/lib/data/schemas';

export default function FaqAccordion({
  faqs,
  sectionTitle,
  sectionSubtitle,
}: {
  faqs: Faq[];
  sectionTitle: string;
  sectionSubtitle: string;
}) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);
  const t = useTranslations();

  return (
    <section className="py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            {sectionTitle}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{sectionSubtitle}</p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-3xl border border-slate-200/60 bg-white/80 p-6 shadow-soft"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-900"
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  aria-expanded={isOpen}
                >
                  {t(faq.questionKey)}
                  <span className="ml-4 text-brand-500">{isOpen ? '–' : '+'}</span>
                </button>
                {isOpen && (
                  <p className="mt-4 text-sm text-slate-600">{t(faq.answerKey)}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
