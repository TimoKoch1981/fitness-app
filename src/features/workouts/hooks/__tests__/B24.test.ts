/**
 * B24 — Video-Button fehlt oder Wiedergabe defekt.
 *
 * Bug-Diagnose nach Production-DB-Stichprobe (siehe REGRESSION_TRIAGE):
 * Alle 183 exercise_catalog-Eintraege haben video_url_de + video_url_en
 * gesetzt — Daten-Hypothese gestorben. Der Bug liegt im Catalog-Lookup.
 *
 * Real beobachtete User-Plan-Namen in Production unterscheiden sich vom
 * Catalog auf mehrere Arten:
 *   - "Bizepscurls" vs Catalog "Bizeps-Curls" (Bindestrich-Position)
 *   - "Bankdrücken (Flachbank)" vs "Bankdrücken" (Klammer-Suffix)
 *   - "Beinpressen" vs "Beinpresse" (Plural)
 *   - "Bulgarian Split Squats" vs "Bulgarian Split Squat" (Plural)
 *   - "Bankdruecken" vs "Bankdrücken" (Umlaut-Encoding)
 *
 * Der bestehende partial-Match in findExerciseInCatalog macht
 * `lower.includes(catalog.name)` und vice versa, was Klammer-Suffix gerade
 * noch faengt, aber an Bindestrich oder Umlaut scheitert.
 *
 * Fix-Spec: Normalisierungs-Pass (lowercase, Umlaut→ASCII, alle nicht-alnum
 * Zeichen entfernen) im Lookup, sodass alle obigen Varianten matchen.
 */

import { describe, it, expect } from 'vitest';
import { findExerciseInCatalog } from '../useExerciseCatalog';
import type { CatalogExercise } from '../../../../types/health';

// ── Fixtures ─────────────────────────────────────────────────────────────

const benchPressEntry: CatalogExercise = {
  id: 'bench-press-001',
  name: 'Bankdrücken',
  name_en: 'Bench Press',
  aliases: ['Flachbankdrücken', 'Flat Bench'],
  category: 'strength',
  muscle_groups: ['Brust'],
  description: '',
  description_en: '',
  video_url_de: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
  video_url_en: 'https://www.youtube.com/watch?v=4Y2ZdHCOXok',
  difficulty: 'intermediate',
  equipment_needed: ['Langhantel'],
  is_compound: true,
};

const bicepCurlsEntry: CatalogExercise = {
  id: 'bicep-curls-001',
  name: 'Bizeps-Curls',
  name_en: 'Bicep Curls',
  aliases: ['Curls'],
  category: 'strength',
  muscle_groups: ['Bizeps'],
  description: '',
  description_en: '',
  video_url_de: 'https://www.youtube.com/watch?v=kwG2ipFRgFo',
  video_url_en: 'https://www.youtube.com/watch?v=kwG2ipFRgFo',
  difficulty: 'beginner',
  equipment_needed: ['Kurzhantel'],
  is_compound: false,
};

const catalog: CatalogExercise[] = [benchPressEntry, bicepCurlsEntry];

// ── B24 — Robuster Catalog-Lookup ────────────────────────────────────────

describe('B24 — findExerciseInCatalog Robustheit gegen User-Plan-Schreibvarianten', () => {
  it('matcht exakt mit Umlaut (Sanity)', () => {
    const result = findExerciseInCatalog('Bankdrücken', catalog);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('bench-press-001');
  });

  it('matcht ASCII-Variante "Bankdruecken" ebenfalls auf "Bankdrücken"', () => {
    const result = findExerciseInCatalog('Bankdruecken', catalog);
    expect(
      result,
      'findExerciseInCatalog muss Umlaut-Varianten (ue/ü) als gleichwertig behandeln',
    ).not.toBeNull();
    expect(result?.id).toBe('bench-press-001');
  });

  it('matcht englischen Namen "Bench Press" auf deutsches Catalog-Entry', () => {
    const result = findExerciseInCatalog('Bench Press', catalog);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('bench-press-001');
  });

  it('matcht "Bizepscurls" (ohne Bindestrich) auf "Bizeps-Curls"', () => {
    // Echte Plan-Daten aus Production. Der alte partial-Match scheitert, weil
    // weder String den anderen exakt enthaelt (Bindestrich bricht es).
    const result = findExerciseInCatalog('Bizepscurls', catalog);
    expect(
      result,
      'Bindestriche und sonstige Sonderzeichen duerfen den Lookup nicht brechen',
    ).not.toBeNull();
    expect(result?.id).toBe('bicep-curls-001');
  });

  it('matcht "Bankdrücken (Flachbank)" (Klammer-Suffix) auf "Bankdrücken"', () => {
    // Echte Plan-Daten: User-Wizard fuegt oft Praezisierungen in Klammern ein.
    const result = findExerciseInCatalog('Bankdrücken (Flachbank)', catalog);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('bench-press-001');
  });

  it('matcht "Bizepscurls (mit Kurzhanteln)" — Kombination Bindestrich-frei + Klammer', () => {
    const result = findExerciseInCatalog('Bizepscurls (mit Kurzhanteln)', catalog);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('bicep-curls-001');
  });
});
