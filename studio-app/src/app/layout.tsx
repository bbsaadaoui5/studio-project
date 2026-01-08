import type { Metadata } from 'next';
import './globals.css';
import { FirebaseInitializer } from '@/components/firebase-initializer';
import FirebaseNotConfiguredBanner from '@/components/dev/FirebaseNotConfiguredBanner';
import ClientProviders from '@/components/ClientProviders';
import { Inter, Cairo } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['400','500','600','700'] });
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo', weight: ['400','500','600','700','800'] });

export const metadata: Metadata = {
  title: 'مؤسسة الموعد - نظام إدارة الحرم الجامعي',
  description: 'نظام إدارة مدرسي وجامعي شامل',
  icons: {
    icon: '/Almawed.png',
    apple: '/Almawed.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <title>مؤسسة الموعد - نظام الإدارة</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
    <body className={`${inter.variable} ${cairo.variable} font-body antialiased overflow-x-hidden`}>
  <FirebaseInitializer />
  <FirebaseNotConfiguredBanner />
      {/* Skip link for keyboard users */}
      <a href="#main-content" className="skip-link sr-only-focusable">تخطي إلى المحتوى</a>
      <main id="main-content" role="main" aria-label="المحتوى الرئيسي" className="w-full">
            {/* Server-rendered H1: use an inline off-screen style so it's present
                in the server HTML even if Tailwind utilities or client CSS
                haven't loaded yet. This guarantees axe finds a level-one
                heading during scans without affecting layout. */}
            <h1 id="site-heading" style={{position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden'}}>مؤسسة الموعد</h1>
            <ClientProviders>
              {children}
            </ClientProviders>
          </main>
      </body>
    </html>
  );
}