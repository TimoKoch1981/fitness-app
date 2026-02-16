import { createContext, useContext } from 'react';
import { de, type TranslationKeys } from './de';
import { en } from './en';

export type Language = 'de' | 'en';

const translations: Record<Language, TranslationKeys> = { de, en };

export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

export const I18nContext = createContext<I18nContextType>({
  language: 'de',
  setLanguage: () => {},
  t: de,
});

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

export function getTranslations(lang: Language): TranslationKeys {
  return translations[lang];
}

export { de, en };
export type { TranslationKeys };
