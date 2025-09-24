'use client';

import type { ReactNode } from 'react';
import BackToTop from './BackToTop';
import Footer, { type FooterLink } from './Footer';
import Navigation, { type NavItem } from './Navigation';
import { SectionObserverProvider } from './SectionObserver';

export default function LayoutShell({
  children,
  navItems,
  footer,
  sectionIds,
}: {
  children: ReactNode;
  navItems: NavItem[];
  footer: { tagline: string; legal: string; nav: FooterLink[] };
  sectionIds: string[];
}) {
  return (
    <SectionObserverProvider sectionIds={sectionIds}>
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navigation items={navItems} />
        <main className="flex-1">{children}</main>
        <Footer tagline={footer.tagline} legal={footer.legal} nav={footer.nav} />
        <BackToTop />
      </div>
    </SectionObserverProvider>
  );
}
