"use client";

import React, { useEffect } from 'react';
import { TranslationProvider } from '@/i18n/translation-provider';
import { AuthProvider } from '@/hooks/use-auth';
import { InstallAppButton } from '@/components/install-app-button';
import { Toaster } from '@/components/ui/toaster';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Force Arabic as the default language
    try {
      // Clear any cached language preference
      localStorage.removeItem('language');
      localStorage.removeItem('test-language');
      localStorage.removeItem('lang');
      localStorage.removeItem('locale');
      
      // Force document to Arabic
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
      document.documentElement.setAttribute('lang', 'ar');
      document.documentElement.setAttribute('dir', 'rtl');
      
      // Also set body
      if (document.body) {
        document.body.lang = 'ar';
        document.body.dir = 'rtl';
      }
    } catch (e) {
      // ignore (SSR safety)
    }
  }, []);

  return (
    <AuthProvider>
      <TranslationProvider initialLanguage="ar">
        {children}
        <InstallAppButton />
        <Toaster />
      </TranslationProvider>
    </AuthProvider>
  );
}
