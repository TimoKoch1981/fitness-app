import { describe, it, expect } from 'vitest';
import { findExerciseInCatalog } from '../useExerciseCatalog';
import type { CatalogExercise } from '../../../../types/health';

// ── Test Catalog ────────────────────────────────────────────────────────

function makeCatalog(): CatalogExercise[] {
  return [
    {
      id: '1', name: 'Bankdrücken', name_en: 'Bench Press',
      aliases: ['Flachbankdrücken', 'Flat Bench'],
      category: 'strength', muscle_groups: ['Brust', 'Trizeps'],
      description: 'Test', difficulty: 'intermediate',
      equipment_needed: ['Langhantel'], is_compound: true, created_at: '',
    },
    {
      id: '2', name: 'Klimmzüge', name_en: 'Pull-Ups',
      aliases: ['Chin-Ups', 'Pullups', 'Klimmi'],
      category: 'strength', muscle_groups: ['Latissimus', 'Bizeps'],
      description: 'Test', difficulty: 'intermediate',
      equipment_needed: ['Klimmzugstange'], is_compound: true, created_at: '',
    },
    {
      id: '3', name: 'Sonnengruß A', name_en: 'Sun Salutation A',
      aliases: ['Surya Namaskar A', 'Sonnengruss'],
      category: 'flexibility', muscle_groups: ['Ganzkörper'],
      description: 'Test', difficulty: 'beginner',
      equipment_needed: [], is_compound: false, created_at: '',
    },
    {
      id: '4', name: 'Laufen (Grundlagenlauf)', name_en: 'Easy Run',
      aliases: ['Jogging', 'Joggen', 'Dauerlauf'],
      category: 'cardio', muscle_groups: ['Beine'],
      description: 'Test', difficulty: 'beginner',
      equipment_needed: [], is_compound: false, created_at: '',
    },
  ] as CatalogExercise[];
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('findExerciseInCatalog', () => {
  const catalog = makeCatalog();

  // Exact match
  it('finds exercise by exact German name', () => {
    const result = findExerciseInCatalog('Bankdrücken', catalog);
    expect(result).toBeDefined();
    expect(result!.id).toBe('1');
  });

  it('finds exercise by exact English name', () => {
    const result = findExerciseInCatalog('Bench Press', catalog);
    expect(result).toBeDefined();
    expect(result!.id).toBe('1');
  });

  // Alias match
  it('finds exercise by alias', () => {
    const result = findExerciseInCatalog('Flachbankdrücken', catalog);
    expect(result).toBeDefined();
    expect(result!.id).toBe('1');
  });

  it('finds exercise by English alias', () => {
    const result = findExerciseInCatalog('Pullups', catalog);
    expect(result).toBeDefined();
    expect(result!.id).toBe('2');
  });

  // Case insensitive
  it('is case-insensitive', () => {
    const result = findExerciseInCatalog('bankdrücken', catalog);
    expect(result).toBeDefined();
    expect(result!.id).toBe('1');
  });

  it('is case-insensitive for English names', () => {
    const result = findExerciseInCatalog('bench press', catalog);
    expect(result).toBeDefined();
    expect(result!.id).toBe('1');
  });

  it('is case-insensitive for aliases', () => {
    const result = findExerciseInCatalog('chin-ups', catalog);
    expect(result).toBeDefined();
    expect(result!.id).toBe('2');
  });

  // Partial match
  it('finds exercise by partial name', () => {
    const result = findExerciseInCatalog('Klimmzüge mit Gewicht', catalog);
    expect(result).toBeDefined();
    expect(result!.id).toBe('2');
  });

  // No match
  it('returns null for unknown exercise', () => {
    const result = findExerciseInCatalog('Einhorn Presse', catalog);
    expect(result).toBeNull();
  });

  // Edge cases
  it('returns null for empty string', () => {
    const result = findExerciseInCatalog('', catalog);
    expect(result).toBeNull();
  });

  it('returns null for empty catalog', () => {
    const result = findExerciseInCatalog('Bankdrücken', []);
    expect(result).toBeNull();
  });

  it('handles whitespace in name', () => {
    const result = findExerciseInCatalog('  Bankdrücken  ', catalog);
    expect(result).toBeDefined();
    expect(result!.id).toBe('1');
  });

  // Yoga exercise
  it('finds yoga exercise by alias', () => {
    const result = findExerciseInCatalog('Surya Namaskar A', catalog);
    expect(result).toBeDefined();
    expect(result!.id).toBe('3');
  });

  // Cardio exercise
  it('finds cardio exercise by alias', () => {
    const result = findExerciseInCatalog('Joggen', catalog);
    expect(result).toBeDefined();
    expect(result!.id).toBe('4');
  });
});
