'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/translation-provider';

// Minimal typing for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>; 
  prompt(): Promise<void>;
}

export function InstallAppButton() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowButton(false);
    }
  };

  if (!showButton) return null;

  return (
    <button
      type="button"
      onClick={handleInstall}
      className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50"
    >
      \ud83d\udcf1 {t('app.installApp')}
    </button>
  );
}