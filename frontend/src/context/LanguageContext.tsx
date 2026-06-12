import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Lang, Translations } from '../i18n/translations';
import { en, ur } from '../i18n/translations';

interface LanguageContextType {
  lang: Lang;
  t: Translations;
  toggleLang: () => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  t: en,
  toggleLang: () => {},
  isRTL: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'ur' : 'en');
  };

  useEffect(() => {
    const html = document.documentElement;
    if (lang === 'ur') {
      html.setAttribute('dir', 'rtl');
      html.setAttribute('lang', 'ur');
    } else {
      html.setAttribute('dir', 'ltr');
      html.setAttribute('lang', 'en');
    }
  }, [lang]);

  return (
    <LanguageContext.Provider value={{
      lang,
      t: lang === 'en' ? en : ur,
      toggleLang,
      isRTL: lang === 'ur',
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
