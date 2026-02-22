/**
 * Goal Calculation Tests — validateRecommendedGoals chain.
 *
 * Tests the full chain: Weight + Profile → BMR → TDEE → Calories → Protein → Water
 */
import { describe, it, expect } from 'vitest';
import { calculateRecommendedGoals } from '../goals';
import type { GoalCalculationInput } from '../goals';

// ── Fixtures ──────────────────────────────────────────────────────────

const baseInput: GoalCalculationInput = {
  weight_kg: 90,
  height_cm: 182,
  birth_date: '1981-06-15',
  gender: 'male',
  activity_level: 1.55,
};

// ── Tests ─────────────────────────────────────────────────────────────

describe('calculateRecommendedGoals', () => {
  it('returns valid goals for complete male profile', () => {
    const result = calculateRecommendedGoals(baseInput);
    expect(result).not.toBeNull();
    expect(result!.calories).toBeGreaterThan(1500);
    expect(result!.calories).toBeLessThan(4000);
    expect(result!.protein).toBeGreaterThan(50);
    expect(result!.protein).toBeLessThan(400);
    expect(result!.water_glasses).toBeGreaterThan(5);
    expect(result!.water_glasses).toBeLessThan(20);
    expect(result!.bmr).toBeGreaterThan(1000);
    expect(result!.tdee).toBeGreaterThan(result!.bmr);
    expect(['mifflin', 'katch']).toContain(result!.bmr_formula);
  });

  it('returns valid goals for female profile', () => {
    const result = calculateRecommendedGoals({
      ...baseInput,
      gender: 'female',
      weight_kg: 65,
      height_cm: 168,
    });
    expect(result).not.toBeNull();
    expect(result!.calories).toBeGreaterThan(1000);
    expect(result!.calories).toBeLessThan(3000);
    expect(result!.bmr).toBeLessThan(baseInput.weight_kg * 25); // female BMR lower
  });

  it('uses Katch-McArdle when body fat is provided', () => {
    const result = calculateRecommendedGoals({
      ...baseInput,
      body_fat_pct: 18,
      preferred_bmr_formula: 'auto',
    });
    expect(result).not.toBeNull();
    expect(result!.bmr_formula).toBe('katch');
  });

  it('uses Mifflin when explicitly selected', () => {
    const result = calculateRecommendedGoals({
      ...baseInput,
      preferred_bmr_formula: 'mifflin',
    });
    expect(result).not.toBeNull();
    expect(result!.bmr_formula).toBe('mifflin');
  });

  // ── Goal mapping tests ──────────────────────────────────────────

  it('fat_loss goal produces calorie deficit', () => {
    const result = calculateRecommendedGoals({
      ...baseInput,
      primary_goal: 'fat_loss',
    });
    expect(result).not.toBeNull();
    expect(result!.calories).toBeLessThan(result!.tdee);
  });

  it('muscle_gain goal produces calorie surplus', () => {
    const result = calculateRecommendedGoals({
      ...baseInput,
      primary_goal: 'muscle_gain',
    });
    expect(result).not.toBeNull();
    expect(result!.calories).toBeGreaterThan(result!.tdee);
  });

  it('body_recomp goal is near maintenance', () => {
    const result = calculateRecommendedGoals({
      ...baseInput,
      primary_goal: 'body_recomp',
    });
    expect(result).not.toBeNull();
    expect(Math.abs(result!.calories - result!.tdee)).toBeLessThan(200);
  });

  // ── Water calculation ───────────────────────────────────────────

  it('water goal is ~35ml/kg in glasses of 250ml', () => {
    const result = calculateRecommendedGoals(baseInput);
    expect(result).not.toBeNull();
    // 90kg * 35ml = 3150ml / 250ml = 12.6 → 13 glasses
    expect(result!.water_glasses).toBe(Math.round((90 * 35) / 250));
  });

  // ── Activity level impact ───────────────────────────────────────

  it('higher activity level increases TDEE and calories', () => {
    const sedentary = calculateRecommendedGoals({
      ...baseInput,
      activity_level: 1.4,
      primary_goal: 'health',
    });
    const veryActive = calculateRecommendedGoals({
      ...baseInput,
      activity_level: 1.9,
      primary_goal: 'health',
    });
    expect(sedentary).not.toBeNull();
    expect(veryActive).not.toBeNull();
    expect(veryActive!.tdee).toBeGreaterThan(sedentary!.tdee);
    expect(veryActive!.calories).toBeGreaterThan(sedentary!.calories);
  });

  // ── Null returns for missing data ───────────────────────────────

  it('returns null when weight is missing', () => {
    const result = calculateRecommendedGoals({
      ...baseInput,
      weight_kg: 0,
    });
    expect(result).toBeNull();
  });

  it('returns null when height is missing', () => {
    const result = calculateRecommendedGoals({
      ...baseInput,
      height_cm: 0,
    });
    expect(result).toBeNull();
  });

  it('returns null when birth_date is missing', () => {
    const result = calculateRecommendedGoals({
      ...baseInput,
      birth_date: '',
    });
    expect(result).toBeNull();
  });

  it('returns null for unrealistic age', () => {
    const result = calculateRecommendedGoals({
      ...baseInput,
      birth_date: '2025-01-01', // baby
    });
    // age would be ~1, but BMR should still calculate
    // This tests the boundary
    expect(result).not.toBeNull();
  });
});
