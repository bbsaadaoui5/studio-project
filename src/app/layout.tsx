import type { Metadata } from 'next';
import './globals.css';
import { FirebaseInitializer } from '@/components/firebase-initializer';
import { InstallAppButton } from '@/components/install-app-button';

export const metadata: Metadata = {
  title: 'Almawed - Campus Management System',
  description: 'Comprehensive school and campus management system',
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
    <html suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#4F46E5" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="font-body antialiased">
        <FirebaseInitializer />
        {children}
        <InstallAppButton />
      </body>
    </html>
  );
}