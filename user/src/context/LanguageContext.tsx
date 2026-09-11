import React, { createContext, useContext, useState, useCallback } from 'react';
import { SUPPORTED_LANGUAGES } from '../i18n/types';
import type { SupportedLanguage, LanguageOption } from '../i18n/types';
import { getTranslation } from '../i18n/locales';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, paramsOrFallback?: Record<string, string | number> | string, fallback?: string) => string;
  languages: LanguageOption[];
  currentLanguageOption: LanguageOption;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'mito_app_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && ['en', 'ta', 'te', 'kn', 'hi'].includes(saved)) {
      return saved as SupportedLanguage;
    }
    // Check navigator language if available
    const browserLang = navigator.language?.toLowerCase() || '';
    if (browserLang.startsWith('ta')) return 'ta';
    if (browserLang.startsWith('te')) return 'te';
    if (browserLang.startsWith('kn')) return 'kn';
    if (browserLang.startsWith('hi')) return 'hi';
    return 'en';
  });

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    window.dispatchEvent(new CustomEvent('language_changed', { detail: { language: lang } }));
  }, []);

  React.useEffect(() => {
    const handleLangChange = (e: any) => {
      const newLang = e?.detail?.language || localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (newLang && ['en', 'ta', 'te', 'kn', 'hi'].includes(newLang) && newLang !== language) {
        setLanguageState(newLang as SupportedLanguage);
      }
    };
    window.addEventListener('language_changed', handleLangChange);
    window.addEventListener('storage', handleLangChange);
    return () => {
      window.removeEventListener('language_changed', handleLangChange);
      window.removeEventListener('storage', handleLangChange);
    };
  }, [language]);

  const t = useCallback(
    (key: string, paramsOrFallback?: Record<string, string | number> | string, fallback?: string) => {
      return getTranslation(language, key, paramsOrFallback, fallback);
    },
    [language]
  );

  const currentLanguageOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
        currentLanguageOption
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
