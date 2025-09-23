'use client';

import { useSearchParams } from 'next/navigation';
import type { ComponentProps } from 'react';
import ListingsGrid from '../components/ListingsGrid';
import type { AppLocale } from '@/lib/i18n';

type ListingsGridProps = ComponentProps<typeof ListingsGrid>;

type Props = Omit<ListingsGridProps, 'locale' | 'query' | 'tag'> & {
  locale: AppLocale;
};

export default function ListingsSearchClient({ locale, ...gridProps }: Props) {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const tag = searchParams.get('tag');

  return <ListingsGrid {...gridProps} locale={locale} query={query} tag={tag} />;
}
