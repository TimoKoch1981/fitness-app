/**
 * i18n Consistency Tests — Ensures DE and EN translations have matching keys.
 *
 * Catches:
 * - Missing keys in either language
 * - Empty translation values
 * - Structure mismatches between DE and EN
 */
import { describe, it, expect } from 'vitest';
import { de } from '../de';
import { en } from '../en';

// ── Helpers ──────────────────────────────────────────────────────────

type TranslationObject = Record<string, string | Record<string, string>>;

/** Get all leaf keys as dot-paths (e.g. "common.save", "meals.title") */
function getAllKeys(obj: TranslationObject, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      keys.push(...getAllKeys(value as TranslationObject, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

/** Get all top-level section names */
function getSections(obj: TranslationObject): string[] {
  return Object.keys(obj).sort();
}

// ── Tests ────────────────────────────────────────────────────────────

describe('i18n — DE/EN key consistency', () => {
  const deKeys = getAllKeys(de as unknown as TranslationObject);
  const enKeys = getAllKeys(en as unknown as TranslationObject);

  it('DE and EN have the same number of keys', () => {
    expect(deKeys.length).toBe(enKeys.length);
  });

  it('DE and EN have the same top-level sections', () => {
    const deSections = getSections(de as unknown as TranslationObject);
    const enSections = getSections(en as unknown as TranslationObject);
    expect(deSections).toEqual(enSections);
  });

  it('every DE key exists in EN', () => {
    const enKeySet = new Set(enKeys);
    const missingInEN = deKeys.filter((k) => !enKeySet.has(k));
    expect(missingInEN).toEqual([]);
  });

  it('every EN key exists in DE', () => {
    const deKeySet = new Set(deKeys);
    const missingInDE = enKeys.filter((k) => !deKeySet.has(k));
    expect(missingInDE).toEqual([]);
  });
});

describe('i18n — no empty values', () => {
  function checkNoEmpty(obj: TranslationObject, lang: string, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null) {
        checkNoEmpty(value as TranslationObject, lang, fullKey);
      } else {
        it(`${lang}.${fullKey} is not empty`, () => {
          expect(value).toBeTruthy();
          expect(typeof value).toBe('string');
          expect((value as string).trim().length).toBeGreaterThan(0);
        });
      }
    }
  }

  describe('DE translations', () => {
    checkNoEmpty(de as unknown as TranslationObject, 'DE');
  });

  describe('EN translations', () => {
    checkNoEmpty(en as unknown as TranslationObject, 'EN');
  });
});

describe('i18n — section structure', () => {
  it('each section has at least 2 keys', () => {
    const deSections = getSections(de as unknown as TranslationObject);
    for (const section of deSections) {
      const sectionObj = (de as unknown as TranslationObject)[section];
      if (typeof sectionObj === 'object') {
        const keyCount = Object.keys(sectionObj).length;
        expect(keyCount, `Section "${section}" has only ${keyCount} key(s)`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('DE and EN have matching keys per section', () => {
    const deSections = getSections(de as unknown as TranslationObject);
    for (const section of deSections) {
      const deSection = (de as unknown as TranslationObject)[section];
      const enSection = (en as unknown as TranslationObject)[section];
      if (typeof deSection === 'object' && typeof enSection === 'object') {
        const deSecKeys = Object.keys(deSection as Record<string, string>).sort();
        const enSecKeys = Object.keys(enSection as Record<string, string>).sort();
        expect(deSecKeys, `Section "${section}" key mismatch`).toEqual(enSecKeys);
      }
    }
  });
});

describe('i18n — content sanity', () => {
  it('app name is FitBuddy in both languages', () => {
    expect(de.app.name).toBe('FitBuddy');
    expect(en.app.name).toBe('FitBuddy');
  });

  it('DE translations contain German characters (umlauts)', () => {
    // At least some DE values should contain ä, ö, ü, ß
    const allDE = getAllKeys(de as unknown as TranslationObject);
    const deValues = allDE.map((key) => {
      const parts = key.split('.');
      let value: unknown = de;
      for (const part of parts) {
        value = (value as Record<string, unknown>)[part];
      }
      return value as string;
    });
    const hasUmlaut = deValues.some((v) => /[äöüÄÖÜß]/.test(v));
    expect(hasUmlaut).toBe(true);
  });

  it('EN translations do not contain German umlauts', () => {
    const allEN = getAllKeys(en as unknown as TranslationObject);
    const enValues = allEN.map((key) => {
      const parts = key.split('.');
      let value: unknown = en;
      for (const part of parts) {
        value = (value as Record<string, unknown>)[part];
      }
      return value as string;
    });
    const hasUmlaut = enValues.some((v) => /[äöüÄÖÜß]/.test(v));
    expect(hasUmlaut).toBe(false);
  });
});
