import { createContext, useContext } from 'react';
import { de, type TranslationKeys } from './de';
import { en } from './en';

export type Language =
  | 'de' | 'en'
  | 'tr' | 'uk' | 'pl' | 'ru' | 'ro'
  | 'es' | 'fr' | 'it' | 'pt'
  | 'ar' | 'zh' | 'ja' | 'ko'
  | 'fa' | 'fil';

/**
 * Lazy-loading language map.
 * Only de + en are eagerly loaded (bundled in main chunk).
 * All other languages are loaded on demand via dynamic import().
 */
const eagerTranslations: Partial<Record<Language, TranslationKeys>> = { de, en };

// Cache for dynamically loaded translations
const translationCache: Partial<Record<Language, TranslationKeys>> = { de, en };

/**
 * Lazy-load a language translation module.
 * Returns cached translations if already loaded, otherwise dynamically imports.
 */
const languageLoaders: Record<Language, () => Promise<TranslationKeys>> = {
  de: () => Promise.resolve(de),
  en: () => Promise.resolve(en),
  tr: () => import('./tr').then(m => m.tr),
  uk: () => import('./uk').then(m => m.uk),
  pl: () => import('./pl').then(m => m.pl),
  ru: () => import('./ru').then(m => m.ru),
  ro: () => import('./ro').then(m => m.ro),
  es: () => import('./es').then(m => m.es),
  fr: () => import('./fr').then(m => m.fr),
  it: () => import('./it').then(m => m.it),
  pt: () => import('./pt').then(m => m.pt),
  ar: () => import('./ar').then(m => m.ar),
  zh: () => import('./zh').then(m => m.zh),
  ja: () => import('./ja').then(m => m.ja),
  ko: () => import('./ko').then(m => m.ko),
  fa: () => import('./fa').then(m => m.fa),
  fil: () => import('./fil').then(m => m.fil),
};

/**
 * Load translations for a language. Returns immediately from cache
 * if available, otherwise loads asynchronously.
 */
export async function loadTranslations(lang: Language): Promise<TranslationKeys> {
  const cached = translationCache[lang];
  if (cached) return cached;
  const loaded = await languageLoaders[lang]();
  translationCache[lang] = loaded;
  return loaded;
}

/**
 * Get translations synchronously. Returns cached translations or de fallback.
 * Used by components that need immediate access.
 */
export function getTranslations(lang: Language): TranslationKeys {
  return translationCache[lang] ?? eagerTranslations[lang] ?? de;
}

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

// Re-export eagerly loaded translations for tests and direct consumers
export { de, en };
export type { TranslationKeys };

/** Display names for language selector UI */
export const LANGUAGE_OPTIONS: { code: Language; label: string; flag: string }[] = [
  { code: 'de', label: 'Deutsch', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'en', label: 'English', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'es', label: 'Espa\u00F1ol', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'fr', label: 'Fran\u00E7ais', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'it', label: 'Italiano', flag: '\u{1F1EE}\u{1F1F9}' },
  { code: 'pt', label: 'Portugu\u00EAs', flag: '\u{1F1F5}\u{1F1F9}' },
  { code: 'tr', label: 'T\u00FCrk\u00E7e', flag: '\u{1F1F9}\u{1F1F7}' },
  { code: 'pl', label: 'Polski', flag: '\u{1F1F5}\u{1F1F1}' },
  { code: 'ro', label: 'Rom\u00E2n\u0103', flag: '\u{1F1F7}\u{1F1F4}' },
  { code: 'ru', label: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439', flag: '\u{1F1F7}\u{1F1FA}' },
  { code: 'uk', label: '\u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430', flag: '\u{1F1FA}\u{1F1E6}' },
  { code: 'ar', label: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629', flag: '\u{1F1F8}\u{1F1E6}' },
  { code: 'fa', label: '\u0641\u0627\u0631\u0633\u06CC', flag: '\u{1F1EE}\u{1F1F7}' },
  { code: 'zh', label: '\u4E2D\u6587', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: 'ja', label: '\u65E5\u672C\u8A9E', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: 'ko', label: '\uD55C\uAD6D\uC5B4', flag: '\u{1F1F0}\u{1F1F7}' },
  { code: 'fil', label: 'Filipino', flag: '\u{1F1F5}\u{1F1ED}' },
];
