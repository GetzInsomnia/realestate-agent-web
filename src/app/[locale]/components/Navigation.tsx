'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LocaleSwitcher from './LocaleSwitcher';
import { cn } from '@/lib/utils';

export type NavItem = {
  label: string;
  href: string;
};

export default function Navigation({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href={items[0]?.href ?? '/'}
          className="text-lg font-semibold text-slate-900"
        >
          ZomZom Property
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative transition hover:text-brand-600',
                pathname.startsWith(item.href) ? 'text-brand-600' : undefined,
              )}
              data-nav={item.href.split('/').pop()}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
