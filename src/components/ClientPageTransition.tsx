'use client';

import type { PropsWithChildren } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';

interface ClientPageTransitionProps extends PropsWithChildren {
  /**
   * Optional locale that can be provided as a fallback.
   */
  fallbackLocale?: string;
}

export default function ClientPageTransition({
  children,
  fallbackLocale,
}: ClientPageTransitionProps) {
  const pathname = usePathname();
  const localeFromHook = useLocale();

  const locale = localeFromHook ?? fallbackLocale ?? 'default';
  const transitionKey = `${locale}:${pathname ?? ''}`;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -2 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
