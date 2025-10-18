"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// Translation data
import arTranslations from './locales/ar.json';
import pseudoTranslations from './locales/pseudo.json';

const translations = {
  ar: arTranslations,
  en: {}, // We'll use English as fallback
  pseudo: pseudoTranslations // For testing missing translations
};

type Language = 'ar' | 'en' | 'pseudo';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, unknown>) => string;
  dir: 'ltr' | 'rtl';
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('ar'); // Default to Arabic

  useEffect(() => {
    // Check for test language in localStorage
    const testLang = localStorage.getItem('test-language');
    if (testLang === 'pseudo') {
      setLanguage('pseudo');
    }
  }, []);

  useEffect(() => {
    // Set document direction and language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, params?: Record<string, unknown>): string => {
    const keys = key.split('.');
  let value: unknown = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[k];
      } else {
        // If in pseudo mode, show missing key clearly
        if (language === 'pseudo') {
          return `[MISSING: ${key}]`;
        }
        return key; // Return the key itself if not found
      }
    }
    
    // Basic interpolation: replace {var} in the string with values from params if provided
  let result = typeof value === 'string' ? value : key;
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

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
