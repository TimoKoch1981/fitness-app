import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePageBuddySuggestions } from '../usePageBuddySuggestions';
import type { PageId } from '../usePageBuddySuggestions';

// ── Helpers ──────────────────────────────────────────────────────────

function getSuggestions(pageId: PageId, language: 'de' | 'en' = 'de') {
  const { result } = renderHook(() => usePageBuddySuggestions(pageId, language));
  return result.current;
}

// ── General Structure ────────────────────────────────────────────────

describe('usePageBuddySuggestions — structure', () => {
  const pages: PageId[] = [
    'tracking_nutrition',
    'tracking_training',
    'tracking_training_plan',
    'tracking_body',
    'medical',
    'cockpit',
  ];

  it.each(pages)('returns 2-3 suggestions for page "%s"', (pageId) => {
    const suggestions = getSuggestions(pageId);
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(suggestions.length).toBeLessThanOrEqual(3);
  });

  it.each(pages)('each suggestion has id, label, message for page "%s"', (pageId) => {
    const suggestions = getSuggestions(pageId);
    suggestions.forEach((s) => {
      expect(s.id).toBeTruthy();
      expect(s.label).toBeTruthy();
      expect(s.message).toBeTruthy();
    });
  });

  it.each(pages)('each suggestion has an emoji icon for page "%s"', (pageId) => {
    const suggestions = getSuggestions(pageId);
    suggestions.forEach((s) => {
      expect(s.icon).toBeDefined();
      expect(s.icon!.length).toBeGreaterThan(0);
    });
  });

  it('all suggestion IDs are unique across all pages', () => {
    const allIds = pages.flatMap((pageId) =>
      getSuggestions(pageId).map((s) => s.id)
    );
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});

// ── Language Switching ───────────────────────────────────────────────

describe('usePageBuddySuggestions — i18n', () => {
  it('returns German labels and messages for de', () => {
    const suggestions = getSuggestions('tracking_nutrition', 'de');
    // Check one known suggestion
    const evalSugg = suggestions.find((s) => s.id === 'meals_evaluate');
    expect(evalSugg).toBeDefined();
    expect(evalSugg!.label).toBe('Tag auswerten');
    expect(evalSugg!.message).toContain('Ernährung');
  });

  it('returns English labels and messages for en', () => {
    const suggestions = getSuggestions('tracking_nutrition', 'en');
    const evalSugg = suggestions.find((s) => s.id === 'meals_evaluate');
    expect(evalSugg).toBeDefined();
    expect(evalSugg!.label).toBe('Evaluate Day');
    expect(evalSugg!.message).toContain('nutrition');
  });

  it('German and English suggestions have same IDs', () => {
    const deIds = getSuggestions('cockpit', 'de').map((s) => s.id);
    const enIds = getSuggestions('cockpit', 'en').map((s) => s.id);
    expect(deIds).toEqual(enIds);
  });
});

// ── Page-Specific Content ────────────────────────────────────────────

describe('usePageBuddySuggestions — page content', () => {
  it('nutrition page has meals-related suggestions', () => {
    const ids = getSuggestions('tracking_nutrition').map((s) => s.id);
    expect(ids).toContain('meals_evaluate');
    expect(ids).toContain('meals_suggest');
    expect(ids).toContain('meals_protein');
  });

  it('training page has workout-related suggestions', () => {
    const ids = getSuggestions('tracking_training').map((s) => s.id);
    expect(ids).toContain('workout_log');
    expect(ids).toContain('workout_advice');
  });

  it('training plan page has plan-related suggestions', () => {
    const ids = getSuggestions('tracking_training_plan').map((s) => s.id);
    expect(ids).toContain('plan_edit');
    expect(ids).toContain('plan_evaluate');
    expect(ids).toContain('plan_create');
  });

  it('body page has body analysis suggestions', () => {
    const ids = getSuggestions('tracking_body').map((s) => s.id);
    expect(ids).toContain('body_analyze');
    expect(ids).toContain('body_recomp');
  });

  it('medical page has BP and substance suggestions', () => {
    const ids = getSuggestions('medical').map((s) => s.id);
    expect(ids).toContain('medical_bp');
    expect(ids).toContain('medical_substances');
    expect(ids).toContain('medical_health');
  });

  it('cockpit page has dashboard suggestions', () => {
    const ids = getSuggestions('cockpit').map((s) => s.id);
    expect(ids).toContain('cockpit_status');
    expect(ids).toContain('cockpit_week');
    expect(ids).toContain('cockpit_recommend');
  });
});

// ── Memoization ──────────────────────────────────────────────────────

describe('usePageBuddySuggestions — memoization', () => {
  it('returns same reference when inputs are unchanged', () => {
    const { result, rerender } = renderHook(
      ({ pageId, language }) => usePageBuddySuggestions(pageId, language),
      { initialProps: { pageId: 'cockpit' as PageId, language: 'de' as const } },
    );
    const first = result.current;
    rerender({ pageId: 'cockpit', language: 'de' });
    expect(result.current).toBe(first); // referential equality
  });

  it('returns different reference when pageId changes', () => {
    const { result, rerender } = renderHook(
      ({ pageId, language }) => usePageBuddySuggestions(pageId, language),
      { initialProps: { pageId: 'cockpit' as PageId, language: 'de' as const } },
    );
    const first = result.current;
    rerender({ pageId: 'medical', language: 'de' });
    expect(result.current).not.toBe(first);
  });
});
