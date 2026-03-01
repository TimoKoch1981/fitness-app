import { createContext, useContext } from 'react';
import { de, type TranslationKeys } from './de';
import { en } from './en';
import { tr } from './tr';
import { uk } from './uk';
import { pl } from './pl';
import { ru } from './ru';
import { ro } from './ro';
import { es } from './es';
import { fr } from './fr';
import { it } from './it';
import { pt } from './pt';
import { ar } from './ar';
import { zh } from './zh';
import { ja } from './ja';
import { ko } from './ko';
import { fa } from './fa';
import { fil } from './fil';

export type Language =
  | 'de' | 'en'
  | 'tr' | 'uk' | 'pl' | 'ru' | 'ro'
  | 'es' | 'fr' | 'it' | 'pt'
  | 'ar' | 'zh' | 'ja' | 'ko'
  | 'fa' | 'fil';

const translations: Record<Language, TranslationKeys> = {
  de, en,
  tr, uk, pl, ru, ro,
  es, fr, it, pt,
  ar, zh, ja, ko,
  fa, fil,
};

export type FontSize = 'small' | 'normal' | 'large' | 'xlarge';

export const FONT_SIZE_SCALE: Record<FontSize, number> = {
  small: 14,
  normal: 16,
  large: 18,
  xlarge: 20,
};

export type BuddyVerbosity = 'brief' | 'normal' | 'detailed';
export type BuddyExpertise = 'beginner' | 'advanced';

export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  buddyVerbosity: BuddyVerbosity;
  setBuddyVerbosity: (v: BuddyVerbosity) => void;
  buddyExpertise: BuddyExpertise;
  setBuddyExpertise: (e: BuddyExpertise) => void;
  t: TranslationKeys;
}

export const I18nContext = createContext<I18nContextType>({
  language: 'de',
  setLanguage: () => {},
  fontSize: 'normal',
  setFontSize: () => {},
  buddyVerbosity: 'normal',
  setBuddyVerbosity: () => {},
  buddyExpertise: 'advanced',
  setBuddyExpertise: () => {},
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

export { de, en, tr, uk, pl, ru, ro, es, fr, it, pt, ar, zh, ja, ko, fa, fil };
export type { TranslationKeys };

/** Display names for language selector UI */
export const LANGUAGE_OPTIONS: { code: Language; label: string; flag: string }[] = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'ro', label: 'Română', flag: '🇷🇴' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'fa', label: 'فارسی', flag: '🇮🇷' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'fil', label: 'Filipino', flag: '🇵🇭' },
];
