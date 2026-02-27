import { useState, useCallback, type ReactNode } from 'react';
import { I18nContext, type Language, getTranslations } from '../../i18n';

interface I18nProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export function I18nProvider({ children, defaultLanguage = 'de' }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('fitbuddy-language');
    // Validate saved language is a supported Language code
    const validCodes: string[] = [
      'de','en','tr','uk','pl','ru','ro',
      'es','fr','it','pt','ar','zh','ja','ko','fa','fil',
    ];
    if (saved && validCodes.includes(saved)) return saved as Language;
    return defaultLanguage;
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('fitbuddy-language', lang);
    document.documentElement.lang = lang;
  }, []);

  const t = getTranslations(language);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}
