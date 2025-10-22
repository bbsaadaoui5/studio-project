
import type {Metadata} from 'next';
import '@/app/globals.css';
import { Toaster } from '@/components/ui/toaster';
import { InstallAppButton } from '@/components/install-app-button';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['400','500','600','700'] });

export const metadata: Metadata = {
  title: 'بوابة أولياء الأمور - مؤسسة الموعد',
  description: 'Access your child\'s academic information and school updates',
  manifest: '/parent-manifest.json',
};

export default function ParentPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/parent-manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/parent-icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} font-body antialiased`}>
        {children}
        <InstallAppButton />
        <Toaster />
      </body>
    </html>
  );
}
