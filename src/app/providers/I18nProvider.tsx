import { useState, useCallback, type ReactNode } from 'react';
import { I18nContext, type Language, type FontSize, FONT_SIZE_SCALE, getTranslations } from '../../i18n';

interface I18nProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

const VALID_FONT_SIZES: string[] = ['small', 'normal', 'large', 'xlarge'];

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

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    const saved = localStorage.getItem('fitbuddy-font-size');
    const size: FontSize = (saved && VALID_FONT_SIZES.includes(saved)) ? saved as FontSize : 'normal';
    // Apply immediately on mount
    document.documentElement.style.fontSize = `${FONT_SIZE_SCALE[size]}px`;
    return size;
  });

  const applyFontSize = useCallback((size: FontSize) => {
    document.documentElement.style.fontSize = `${FONT_SIZE_SCALE[size]}px`;
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('fitbuddy-language', lang);
    document.documentElement.lang = lang;
  }, []);

  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('fitbuddy-font-size', size);
    applyFontSize(size);
  }, [applyFontSize]);

  const t = getTranslations(language);

  return (
    <I18nContext.Provider value={{ language, setLanguage, fontSize, setFontSize, t }}>
      {children}
    </I18nContext.Provider>
  );
}
