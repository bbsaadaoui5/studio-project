
import type {Metadata} from 'next';
import '@/app/globals.css';
import { Toaster } from '@/components/ui/toaster';
import { InstallAppButton } from '@/components/install-app-button';

export const metadata: Metadata = {
  title: 'Parent Portal - Almawed',
  description: 'Access your child\'s academic information and school updates',
  manifest: '/parent-manifest.json',
  themeColor: '#10B981',
};

export default function ParentPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/parent-manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/parent-icon-192.png" />
        <meta name="theme-color" content="#10B981" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-body antialiased">
        {children}
        <InstallAppButton />
        <Toaster />
      </body>
    </html>
  );
}
