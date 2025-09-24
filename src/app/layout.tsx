import type { Metadata, Viewport } from 'next';
import './globals.css';
import { createRootMetadata } from '@/lib/seo';
import { fallbackLocale } from '@/lib/i18n';

export const metadata: Metadata = createRootMetadata();

export const viewport: Viewport = {
  themeColor: '#2563eb',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={fallbackLocale} suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
