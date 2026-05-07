'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Language, type T } from './translations';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: T;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('homza-lang') as Language | null;
    if (saved && saved in translations) setLang(saved);
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLang(lang);
    localStorage.setItem('homza-lang', lang);
  };

  return (
    <LanguageContext.Provider
      value={{ language: mounted ? language : 'en', setLanguage, t: translations[mounted ? language : 'en'] as unknown as T }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
