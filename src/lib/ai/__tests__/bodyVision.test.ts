/**
 * bodyVision Tests
 * Tests: JSON parsing, error handling, sanity checks for body scan analysis
 */

import { describe, it, expect } from 'vitest';
import { parseBodyVisionResponse } from '../bodyVision';

describe('parseBodyVisionResponse', () => {
  it('parses valid JSON response', () => {
    const json = JSON.stringify({
      estimated_body_fat_pct: 15,
      muscle_development: 7,
      symmetry: 8,
      visible_muscle_groups: ['Brust', 'Bizeps', 'Bauch'],
      assessment_de: 'Gute Muskeldefinition mit moderatem Koerperfettanteil.',
      assessment_en: 'Good muscle definition with moderate body fat.',
      confidence: 0.85,
    });

    const result = parseBodyVisionResponse(json, 'de');
    expect(result.estimated_body_fat_pct).toBe(15);
    expect(result.muscle_development).toBe(7);
    expect(result.symmetry).toBe(8);
    expect(result.visible_muscle_groups).toEqual(['Brust', 'Bizeps', 'Bauch']);
    expect(result.assessment_de).toContain('Muskeldefinition');
    expect(result.assessment_en).toContain('muscle definition');
    expect(result.confidence).toBe(0.85);
  });

  it('handles markdown-wrapped JSON', () => {
    const json = '```json\n{"estimated_body_fat_pct": 20, "muscle_development": 5, "symmetry": 6, "visible_muscle_groups": ["Chest"], "assessment_de": "Test", "assessment_en": "Test", "confidence": 0.7}\n```';

    const result = parseBodyVisionResponse(json, 'en');
    expect(result.estimated_body_fat_pct).toBe(20);
    expect(result.muscle_development).toBe(5);
    expect(result.confidence).toBe(0.7);
  });

  it('clamps body fat below 3% with low confidence', () => {
    const json = JSON.stringify({
      estimated_body_fat_pct: 1,
      muscle_development: 9,
      symmetry: 8,
      visible_muscle_groups: ['Abs'],
      assessment_de: 'Extrem niedrig',
      assessment_en: 'Extremely low',
      confidence: 0.9,
    });

    const result = parseBodyVisionResponse(json, 'de');
    expect(result.estimated_body_fat_pct).toBe(3);
    expect(result.confidence).toBeLessThanOrEqual(0.2);
    expect(result.notes).toContain('Unplausib');
  });

  it('clamps body fat above 60% with low confidence', () => {
    const json = JSON.stringify({
      estimated_body_fat_pct: 75,
      muscle_development: 2,
      symmetry: 5,
      visible_muscle_groups: [],
      assessment_de: 'Sehr hoch',
      assessment_en: 'Very high',
      confidence: 0.8,
    });

    const result = parseBodyVisionResponse(json, 'en');
    expect(result.estimated_body_fat_pct).toBe(60);
    expect(result.confidence).toBeLessThanOrEqual(0.2);
    expect(result.notes).toContain('Implausible');
  });

  it('clamps muscle_development and symmetry to 1-10', () => {
    const json = JSON.stringify({
      estimated_body_fat_pct: 18,
      muscle_development: 15,
      symmetry: -2,
      visible_muscle_groups: ['Chest'],
      assessment_de: 'Test',
      assessment_en: 'Test',
      confidence: 0.7,
    });

    const result = parseBodyVisionResponse(json, 'de');
    expect(result.muscle_development).toBe(10);
    expect(result.symmetry).toBe(1);
  });

  it('provides default confidence if missing', () => {
    const json = JSON.stringify({
      estimated_body_fat_pct: 20,
      muscle_development: 6,
      symmetry: 7,
      visible_muscle_groups: [],
      assessment_de: 'Test',
      assessment_en: 'Test',
    });

    const result = parseBodyVisionResponse(json, 'de');
    expect(result.confidence).toBe(0.5);
  });

  it('provides default assessment if missing', () => {
    const json = JSON.stringify({
      estimated_body_fat_pct: 22,
      muscle_development: 5,
      symmetry: 6,
      visible_muscle_groups: [],
      confidence: 0.6,
    });

    const result = parseBodyVisionResponse(json, 'de');
    expect(result.assessment_de).toBeTruthy();
    expect(result.assessment_en).toBeTruthy();
  });

  it('handles invalid JSON gracefully (DE)', () => {
    const result = parseBodyVisionResponse('This is not JSON', 'de');
    expect(result.confidence).toBe(0);
    expect(result.estimated_body_fat_pct).toBe(0);
    expect(result.muscle_development).toBe(0);
    expect(result.symmetry).toBe(0);
    expect(result.visible_muscle_groups).toEqual([]);
    expect(result.assessment_de).toContain('KI-Antwort');
  });

  it('handles invalid JSON gracefully (EN)', () => {
    const result = parseBodyVisionResponse('Not valid', 'en');
    expect(result.confidence).toBe(0);
    expect(result.assessment_en).toContain('AI response');
  });

  it('handles empty string', () => {
    const result = parseBodyVisionResponse('', 'de');
    expect(result.confidence).toBe(0);
    expect(result.estimated_body_fat_pct).toBe(0);
  });

  it('handles NaN values gracefully', () => {
    const json = JSON.stringify({
      estimated_body_fat_pct: 'abc',
      muscle_development: null,
      symmetry: undefined,
      visible_muscle_groups: 'not an array',
      assessment_de: '',
      assessment_en: '',
      confidence: 0.5,
    });

    const result = parseBodyVisionResponse(json, 'de');
    // NaN values get converted to 0 via Number() || 0, then clamped
    expect(result.estimated_body_fat_pct).toBeGreaterThanOrEqual(0);
    expect(result.muscle_development).toBeGreaterThanOrEqual(1);
    expect(result.symmetry).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(result.visible_muscle_groups)).toBe(true);
  });

  it('preserves optional notes when present', () => {
    const json = JSON.stringify({
      estimated_body_fat_pct: 12,
      muscle_development: 8,
      symmetry: 9,
      visible_muscle_groups: ['Abs', 'Chest', 'Quads', 'Delts'],
      assessment_de: 'Sehr gute Definition.',
      assessment_en: 'Very good definition.',
      confidence: 0.92,
      notes: 'Front-facing photo, good lighting',
    });

    const result = parseBodyVisionResponse(json, 'en');
    expect(result.notes).toBe('Front-facing photo, good lighting');
    expect(result.visible_muscle_groups).toHaveLength(4);
  });

  it('rounds decimal body fat to integer', () => {
    const json = JSON.stringify({
      estimated_body_fat_pct: 14.7,
      muscle_development: 6.5,
      symmetry: 7.3,
      visible_muscle_groups: [],
      assessment_de: 'Test',
      assessment_en: 'Test',
      confidence: 0.8,
    });

    const result = parseBodyVisionResponse(json, 'de');
    expect(result.estimated_body_fat_pct).toBe(15);
    expect(result.muscle_development).toBe(7);
    expect(result.symmetry).toBe(7);
  });
});
