import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '../translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('kisanh_lang');
    if (saved === 'en' || saved === 'te' || saved === 'hi') {
      return saved as Language;
    }
    return 'en';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('kisanh_lang', newLang);
    // Update HTML lang attribute
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: string, replacements?: Record<string, string>): string => {
    const dict = translations[lang] || translations['en'];
    // @ts-ignore
    let value = dict[key] || translations['en'][key] || key;
    
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        value = value.replace(`{{${k}}}`, v);
      });
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
