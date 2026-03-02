/**
 * mealVision Tests
 * Tests: JSON parsing, error handling, prompt generation, sanity checks
 */

import { describe, it, expect } from 'vitest';
import { parseMealVisionResponse } from '../mealVision';

describe('parseMealVisionResponse', () => {
  it('parses valid JSON response', () => {
    const json = JSON.stringify({
      name: 'Haehnchenbrust mit Reis',
      calories: 450,
      protein: 42,
      carbs: 48,
      fat: 8,
      confidence: 0.9,
    });

    const result = parseMealVisionResponse(json, 'de');
    expect(result.name).toBe('Haehnchenbrust mit Reis');
    expect(result.calories).toBe(450);
    expect(result.protein).toBe(42);
    expect(result.carbs).toBe(48);
    expect(result.fat).toBe(8);
    expect(result.confidence).toBe(0.9);
  });

  it('handles markdown-wrapped JSON', () => {
    const json = '```json\n{"name": "Salad", "calories": 200, "protein": 10, "carbs": 15, "fat": 12, "confidence": 0.85}\n```';

    const result = parseMealVisionResponse(json, 'en');
    expect(result.name).toBe('Salad');
    expect(result.calories).toBe(200);
    expect(result.confidence).toBe(0.85);
  });

  it('rounds nutritional values to integers', () => {
    const json = JSON.stringify({
      name: 'Test',
      calories: 450.7,
      protein: 42.3,
      carbs: 48.9,
      fat: 8.1,
      fiber: 3.6,
      confidence: 0.8,
    });

    const result = parseMealVisionResponse(json, 'de');
    expect(result.calories).toBe(451);
    expect(result.protein).toBe(42);
    expect(result.carbs).toBe(49);
    expect(result.fat).toBe(8);
    expect(result.fiber).toBe(4);
  });

  it('flags implausibly high calories', () => {
    const json = JSON.stringify({
      name: 'Mega Meal',
      calories: 9999,
      protein: 100,
      carbs: 500,
      fat: 300,
      confidence: 0.9,
    });

    const result = parseMealVisionResponse(json, 'de');
    expect(result.confidence).toBe(0.1);
    expect(result.notes).toContain('Unplausibel');
  });

  it('flags implausibly high calories (English)', () => {
    const json = JSON.stringify({
      name: 'Mega Meal',
      calories: 6000,
      protein: 100,
      carbs: 500,
      fat: 300,
      confidence: 0.9,
    });

    const result = parseMealVisionResponse(json, 'en');
    expect(result.confidence).toBe(0.1);
    expect(result.notes).toContain('Implausibly');
  });

  it('provides default name if missing', () => {
    const json = JSON.stringify({
      calories: 300,
      protein: 20,
      carbs: 30,
      fat: 10,
      confidence: 0.7,
    });

    const result = parseMealVisionResponse(json, 'de');
    expect(result.name).toBe('Unbekannte Mahlzeit');
  });

  it('provides English default name', () => {
    const json = JSON.stringify({
      calories: 300,
      protein: 20,
      carbs: 30,
      fat: 10,
      confidence: 0.7,
    });

    const result = parseMealVisionResponse(json, 'en');
    expect(result.name).toBe('Unknown meal');
  });

  it('sets default confidence if missing', () => {
    const json = JSON.stringify({
      name: 'Test',
      calories: 200,
      protein: 10,
      carbs: 20,
      fat: 5,
    });

    const result = parseMealVisionResponse(json, 'de');
    expect(result.confidence).toBe(0.5);
  });

  it('handles invalid JSON gracefully (DE)', () => {
    const result = parseMealVisionResponse('This is not JSON', 'de');
    expect(result.confidence).toBe(0);
    expect(result.calories).toBe(0);
    expect(result.name).toBe('Nicht erkannt');
    expect(result.notes).toContain('KI-Antwort');
    expect(result.raw_text).toBe('This is not JSON');
  });

  it('handles invalid JSON gracefully (EN)', () => {
    const result = parseMealVisionResponse('Not valid', 'en');
    expect(result.confidence).toBe(0);
    expect(result.name).toBe('Not recognized');
    expect(result.notes).toContain('AI response');
  });

  it('handles empty string', () => {
    const result = parseMealVisionResponse('', 'de');
    expect(result.confidence).toBe(0);
    expect(result.calories).toBe(0);
  });

  it('handles NaN values gracefully', () => {
    const json = JSON.stringify({
      name: 'Test',
      calories: 'abc',
      protein: null,
      carbs: undefined,
      fat: '',
      confidence: 0.5,
    });

    const result = parseMealVisionResponse(json, 'de');
    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
    expect(result.carbs).toBe(0);
    expect(result.fat).toBe(0);
  });

  it('preserves optional fields when present', () => {
    const json = JSON.stringify({
      name: 'Test Meal',
      calories: 400,
      protein: 30,
      carbs: 40,
      fat: 15,
      fiber: 5,
      portion_description: '1 Teller, ca. 350g',
      raw_text: 'I see chicken and rice on a plate',
      confidence: 0.92,
      notes: 'Well-lit photo, clear portions',
    });

    const result = parseMealVisionResponse(json, 'en');
    expect(result.fiber).toBe(5);
    expect(result.portion_description).toBe('1 Teller, ca. 350g');
    expect(result.raw_text).toBe('I see chicken and rice on a plate');
    expect(result.notes).toBe('Well-lit photo, clear portions');
  });
});
