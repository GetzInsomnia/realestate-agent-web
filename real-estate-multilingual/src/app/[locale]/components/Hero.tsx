'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export type HeroHighlight = {
  value: string;
  label: string;
};

export default function Hero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  highlights,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  highlights: HeroHighlight[];
}) {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100"
    >
      <div className="backdrop-grid absolute inset-0 opacity-30"></div>
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-20 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="max-w-2xl space-y-6">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-600"
          >
            {eyebrow}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl lg:text-5xl"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-base text-slate-600 sm:text-lg"
          >
            {subtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-wrap gap-3"
          >
            <Link
              href={primaryCta.href}
              className="shadow-hero rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              {primaryCta.label}
            </Link>
            <Link
              href={secondaryCta.href}
              className="rounded-full border border-brand-200 px-5 py-2 text-sm font-semibold text-brand-600 transition hover:border-brand-300 hover:text-brand-700"
            >
              {secondaryCta.label}
            </Link>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="fade-surface max-w-md"
        >
          <dl className="grid grid-cols-2 gap-6">
            {highlights.map((item) => (
              <div key={item.label}>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  {item.label}
                </dt>
                <dd className="text-2xl font-bold text-slate-900">{item.value}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </div>
    </section>
  );
}
