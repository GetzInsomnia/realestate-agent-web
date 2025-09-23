'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getLocaleLabel, locales } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hash, setHash] = useState<string>('');

  useEffect(() => {
    setHash(window.location.hash ?? '');
  }, []);

  return (
    <label className={cn('flex items-center gap-2 text-sm', className)}>
      <span className="sr-only">Switch language</span>
      <select
        className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-sm font-medium shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        value={locale}
        aria-label="Switch language"
        onChange={(event) => {
          const nextLocale = event.target.value;
          if (!pathname) return;

          const segments = pathname.split('/').filter(Boolean);

          if (segments.length === 0) {
            segments.push(nextLocale);
          } else {
            segments[0] = nextLocale;
          }

          const nextPath = `/${segments.join('/')}`;
          const search = searchParams.toString();
          const nextUrl = `${nextPath}${search ? `?${search}` : ''}${hash}`;

          router.replace(nextUrl, { scroll: false });
        }}
      >
        {locales.map((availableLocale) => (
          <option key={availableLocale} value={availableLocale}>
            {getLocaleLabel(availableLocale)}
          </option>
        ))}
      </select>
    </label>
  );
}
