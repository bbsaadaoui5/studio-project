
import type {Metadata} from 'next';
import '@/app/globals.css';
import { Toaster } from '@/components/ui/toaster';
import { InstallAppButton } from '@/components/install-app-button';
import { Cairo } from 'next/font/google';
import TranslationProvider from '@/i18n/translation-provider';
import ar from '@/i18n/locales/ar.json';
import en from '@/i18n/locales/en.json';

const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo', weight: ['300','400','500','600','700'] });

export const metadata: Metadata = {
  // Use the Arabic locale for the nested Parent Portal layout metadata where available,
  // otherwise fall back to the English locale values. Avoid hard-coded Arabic literals here.
  // Use English metadata here to avoid type mismatches during build.
  title: `${en.parentPortal?.title ?? 'Parent Portal'}`,
  description: en.parentPortal?.description ?? '',
  manifest: '/parent-manifest.json',
};

export default function ParentPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This is a nested layout — do NOT render a second <html> or <body> tag here.
  // The root `src/app/layout.tsx` already renders the document <html>/<body> and
  // using them in a nested layout causes hydration mismatches. Instead we wrap
  // the portal content in a container div and set dir/lang and the Cairo font
  // class on this container.
  return (
    <div lang="ar" dir="rtl" className={`${cairo.className} font-body antialiased`}>
      <TranslationProvider initialLanguage="ar">
        {children}
      </TranslationProvider>
      <InstallAppButton />
      <Toaster />
    </div>
  );
}
