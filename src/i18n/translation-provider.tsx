"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import arTranslations from './locales/ar.json';
import enTranslations from './locales/en.json';
import pseudoTranslations from './locales/pseudo.json';

type Language = 'ar' | 'en' | 'pseudo';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, unknown>) => string;
  dir: 'ltr' | 'rtl';
}

const translations: Record<Language, Record<string, unknown>> = {
  ar: arTranslations as unknown as Record<string, unknown>,
  en: enTranslations as unknown as Record<string, unknown>,
  pseudo: pseudoTranslations as unknown as Record<string, unknown>,
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children, initialLanguage }: { children: React.ReactNode; initialLanguage?: Language }) {
  const [language, setLanguage] = useState<Language>(initialLanguage ?? 'ar');

  useEffect(() => {
    // optional test-language override stored in localStorage
    try {
      const testLang = localStorage.getItem('test-language');
      // Only allow pseudo-localization when running in development (prevents accidental pseudo in prod)
      if (testLang === 'pseudo' && process.env.NODE_ENV === 'development') {
        setLanguage('pseudo');
      }
    } catch (e) {
      // ignore (SSR safety)
    }
  }, []);

  useEffect(() => {
    // Set document direction and language attributes
    if (typeof document !== 'undefined') {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = (key: string, params?: Record<string, unknown>): string => {
    const keys = key.split('.');
    let value: unknown = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[k];
      } else {
        if (language === 'pseudo') return `[MISSING: ${key}]`;
        // fallback to english, then to key
        const fallback = translations.en as Record<string, unknown>;
        let fb: unknown = fallback;
        for (const kk of keys) {
          if (fb && typeof fb === 'object' && kk in (fb as Record<string, unknown>)) {
            fb = (fb as Record<string, unknown>)[kk];
          } else {
            fb = undefined;
            break;
          }
        }
        return typeof fb === 'string' ? fb : key;
      }
    }

    // If the resolved value is a string use it; if it's an object try common string subkeys
    let result: string;
    if (typeof value === 'string' && value.trim() !== '') {
      // non-empty string is a valid translation
      result = value;
    } else if ((typeof value === 'string' && value.trim() === '') || (value && typeof value === 'object')) {
      // empty string or object — treat as missing and try to resolve useful subkeys or fallbacks
      if (typeof value === 'string') {
        // treat empty string as missing
        value = undefined;
      }

      if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const candidates = ['title', 'label', 'name', 'description', 'text'];
      let found: unknown = undefined;
      for (const c of candidates) {
        if (c in obj && typeof obj[c] === 'string') {
          found = obj[c];
          break;
        }
      }

      if (typeof found === 'string') {
        result = found as string;
      } else {
        // fallback to English full key if available
        const fallback = translations.en as Record<string, unknown>;
        let fb: unknown = fallback;
        for (const kk of keys) {
          if (fb && typeof fb === 'object' && kk in (fb as Record<string, unknown>)) {
            fb = (fb as Record<string, unknown>)[kk];
          } else {
            fb = undefined;
            break;
          }
        }
        if (typeof fb === 'string') {
          result = fb;
        } else if (fb && typeof fb === 'object') {
          // if english fallback is an object, try its common subkeys
          const eobj = fb as Record<string, unknown>;
          let efound: unknown = undefined;
          for (const c of ['title', 'label', 'name', 'description', 'text']) {
            if (c in eobj && typeof eobj[c] === 'string') {
              efound = eobj[c];
              break;
            }
          }
          result = typeof efound === 'string' ? (efound as string) : key;
        } else {
          result = key;
        }
      }
      } else {
        result = key;
      }
    }
    if (params && typeof result === 'string') {
      for (const [k, v] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{\\s*${k}\\s*\\}`, 'g'), String(v));
      }
    }
    return result;
  };

  const value: TranslationContextType = {
    language,
    setLanguage,
    t,
    dir: language === 'ar' ? 'rtl' : 'ltr',
  };

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) throw new Error('useTranslation must be used within a TranslationProvider');
  return context;
}

export default TranslationProvider;
