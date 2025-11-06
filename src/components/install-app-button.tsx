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
  const [isRtl, setIsRtl] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [horizontalOffset, setHorizontalOffset] = useState<number | null>(null);
  const [attachToRight, setAttachToRight] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  useEffect(() => {
    try {
      const dir = document.documentElement.getAttribute('dir') || document.dir || 'ltr';
      setIsRtl(dir.toLowerCase() === 'rtl');
    } catch (err) {
      setIsRtl(false);
    }
  }, []);

  // Detect whether the left/right sidebar is currently expanded (has class `w-64`) and
  // whether we're on a small screen. If sidebar is open on desktop, compute an
  // offset so the install button is repositioned away from the sidebar instead
  // of overlapping the settings link.
  useEffect(() => {
    const check = () => {
      try {
        const sidebarElem = document.querySelector('.w-64') as HTMLElement | null;
        const sidebarOpen = !!sidebarElem;
        setIsSidebarOpen(sidebarOpen);
        const mobile = window.matchMedia('(max-width: 768px)').matches;
        setIsMobile(mobile);

        if (sidebarElem && !mobile) {
          const rect = sidebarElem.getBoundingClientRect();
          const onRightSide = rect.right > window.innerWidth / 2;
          setAttachToRight(onRightSide);
          setHorizontalOffset(Math.ceil(rect.width + 24));
        } else {
          setHorizontalOffset(null);
          setAttachToRight(false);
        }
      } catch (err) {
        setIsSidebarOpen(false);
        setIsMobile(false);
        setHorizontalOffset(null);
        setAttachToRight(false);
      }
    };

    // run on mount
    check();

    // observe mutations to catch dynamic changes to the sidebar's classes
    const observer = new MutationObserver(() => check());
    observer.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['class'] });

    // also listen to window resize
    window.addEventListener('resize', check);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', check);
    };
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

  const baseClass = `fixed bottom-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md shadow-lg flex items-center gap-2 text-sm z-50`;
  const inlineStyle: React.CSSProperties = {};

  if (horizontalOffset && !isMobile) {
    if (attachToRight) inlineStyle.right = `${horizontalOffset}px`;
    else inlineStyle.left = `${horizontalOffset}px`;
  } else {
    // default logical placement
    if (isRtl) inlineStyle.left = '16px';
    else inlineStyle.right = '16px';
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      className={baseClass}
      style={inlineStyle}
      aria-label={t('app.installApp')}
    >
      <span aria-hidden>📱</span>
      <span>{t('app.installApp')}</span>
    </button>
  );
}

    // Export a small helper to let other components query whether the button would be visible
    export const __installButtonHelpers = {
      // for tests
      isSidebarOpenSelector: '.w-64'
    };