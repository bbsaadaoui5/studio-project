"use client";

import React from 'react';
import { TranslationProvider } from '@/i18n/translation-provider';
import { InstallAppButton } from '@/components/install-app-button';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <TranslationProvider>
      {children}
      <InstallAppButton />
    </TranslationProvider>
  );
}
