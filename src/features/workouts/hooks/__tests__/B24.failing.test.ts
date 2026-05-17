/**
 * B24 — Video-Button fehlt oder Wiedergabe defekt.
 *
 * Bug: User sieht den Video-Button im Active Workout nicht (oder Modal laedt
 * kein Video). Code-Pfad ist seit Maerz unveraendert; Daten-Issue
 * wahrscheinlich. Aber: Catalog-Lookup (`findExerciseInCatalog`) hat eine
 * schwache Umlaut-Behandlung — `"Bankdruecken"` (ASCII) matcht NICHT
 * `"Bankdrücken"` (Catalog-Name). Wenn User-Plaene via Wizard mit ASCII-Namen
 * erstellt wurden (Wizard-Eingabe ohne Umlaut), schlaegt der Lookup fehl,
 * `catalogEntry = null`, `hasVideo = false`, Button nicht gerendert.
 *
 * Test-Spec: `findExerciseInCatalog` muss robust gegen Umlaut-Encoding sein:
 * "Bankdruecken" / "Bankdrücken" / "BANKDRÜCKEN" muessen alle dieselbe
 * Catalog-Entry treffen.
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

const catalog: CatalogExercise[] = [benchPressEntry];

// ── B24 — Umlaut-Robustheit ──────────────────────────────────────────────

describe('B24 — findExerciseInCatalog Umlaut-Match', () => {
  it('matcht exakt mit Umlaut (Sanity)', () => {
    const result = findExerciseInCatalog('Bankdrücken', catalog);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('bench-press-001');
  });

  it('matcht ASCII-Variante "Bankdruecken" ebenfalls auf "Bankdrücken" Catalog-Entry', () => {
    // Bug-Reproduktion: Wenn der User-Plan via Wizard mit ASCII-Namen erstellt
    // wurde (oder Auto-Vervollstaendigung den Umlaut nicht beibehalten hat),
    // muss der Catalog-Lookup trotzdem klappen — sonst fehlt der Video-Button.
    const result = findExerciseInCatalog('Bankdruecken', catalog);
    expect(
      result,
      'findExerciseInCatalog muss Umlaut-Varianten (ue/ü) als gleichwertig behandeln',
    ).not.toBeNull();
  });

  it('matcht englischen Namen "Bench Press" auf deutsches Catalog-Entry', () => {
    const result = findExerciseInCatalog('Bench Press', catalog);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('bench-press-001');
  });
});
