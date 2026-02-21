import { describe, it, expect } from 'vitest';
import {
  calculateProteinRecommendation,
  getCalorieRecommendation,
  calculateCalorieBalance,
} from '../protein';

// ── Protein Recommendations ──────────────────────────────────────────

describe('calculateProteinRecommendation', () => {
  const weight = 80; // kg

  it('returns correct range for general context (WHO/RDA)', () => {
    const result = calculateProteinRecommendation(weight, 'general');
    expect(result.min_g).toBe(64); // 80 × 0.8
    expect(result.max_g).toBe(80); // 80 × 1.0
    expect(result.context).toBe('general');
    expect(result.source).toBe('WHO/RDA');
  });

  it('returns correct range for strength_maintenance (Morton)', () => {
    const result = calculateProteinRecommendation(weight, 'strength_maintenance');
    expect(result.min_g).toBe(128); // 80 × 1.6
    expect(result.max_g).toBe(176); // 80 × 2.2
    expect(result.source).toContain('Morton');
  });

  it('returns correct range for strength_deficit with lean mass', () => {
    const leanMass = 68; // kg
    const result = calculateProteinRecommendation(weight, 'strength_deficit', leanMass);
    expect(result.min_g).toBe(Math.round(68 * 2.3)); // 156
    expect(result.max_g).toBe(Math.round(68 * 3.1)); // 211
    expect(result.source).toContain('Helms');
  });

  it('estimates lean mass when not provided (strength_deficit)', () => {
    const result = calculateProteinRecommendation(weight, 'strength_deficit');
    // Uses weight × 0.8 as lean mass estimate → 64 kg
    expect(result.min_g).toBe(Math.round(64 * 2.3)); // 147
    expect(result.max_g).toBe(Math.round(64 * 3.1)); // 198
  });

  it('returns correct range for strength_anabolic (Mero)', () => {
    const result = calculateProteinRecommendation(weight, 'strength_anabolic');
    expect(result.min_g).toBe(160); // 80 × 2.0
    expect(result.max_g).toBe(240); // 80 × 3.0
    expect(result.source).toContain('Mero');
  });

  it('defaults to strength_maintenance when no context given', () => {
    const result = calculateProteinRecommendation(weight);
    expect(result.min_g).toBe(128);
    expect(result.max_g).toBe(176);
    expect(result.context).toBe('strength_maintenance');
  });

  it('scales linearly with weight', () => {
    const light = calculateProteinRecommendation(60, 'strength_maintenance');
    const heavy = calculateProteinRecommendation(100, 'strength_maintenance');
    expect(heavy.min_g).toBeGreaterThan(light.min_g);
    expect(heavy.max_g).toBeGreaterThan(light.max_g);
  });

  it('returns rounded values', () => {
    // 73 × 0.8 = 58.4, 73 × 1.0 = 73
    const result = calculateProteinRecommendation(73, 'general');
    expect(result.min_g).toBe(58);
    expect(result.max_g).toBe(73);
    expect(Number.isInteger(result.min_g)).toBe(true);
    expect(Number.isInteger(result.max_g)).toBe(true);
  });

  it('min is always less than or equal to max', () => {
    const contexts = ['general', 'strength_maintenance', 'strength_deficit', 'strength_anabolic'] as const;
    for (const ctx of contexts) {
      const result = calculateProteinRecommendation(80, ctx);
      expect(result.min_g).toBeLessThanOrEqual(result.max_g);
    }
  });
});

// ── Calorie Recommendations ──────────────────────────────────────────

describe('getCalorieRecommendation', () => {
  const tdee = 2500;

  it('calculates moderate fat loss (deficit 300-500)', () => {
    const result = getCalorieRecommendation(tdee, 'fat_loss_moderate');
    expect(result.min_kcal).toBe(2000); // 2500 - 500
    expect(result.max_kcal).toBe(2200); // 2500 - 300
    expect(result.goal).toBe('fat_loss_moderate');
    expect(result.source).toContain('ACSM');
  });

  it('calculates aggressive fat loss (deficit 500-750)', () => {
    const result = getCalorieRecommendation(tdee, 'fat_loss_aggressive');
    expect(result.min_kcal).toBe(1750); // 2500 - 750
    expect(result.max_kcal).toBe(2000); // 2500 - 500
  });

  it('calculates lean bulk (surplus 200-300)', () => {
    const result = getCalorieRecommendation(tdee, 'lean_bulk');
    expect(result.min_kcal).toBe(2700); // 2500 + 200
    expect(result.max_kcal).toBe(2800); // 2500 + 300
    expect(result.source).toContain('Helms');
  });

  it('calculates bulk (surplus 300-500)', () => {
    const result = getCalorieRecommendation(tdee, 'bulk');
    expect(result.min_kcal).toBe(2800); // 2500 + 300
    expect(result.max_kcal).toBe(3000); // 2500 + 500
  });

  it('calculates recomposition (maintenance to slight surplus)', () => {
    const result = getCalorieRecommendation(tdee, 'recomposition');
    expect(result.min_kcal).toBe(2500); // tdee + 0
    expect(result.max_kcal).toBe(2600); // tdee + 100
    expect(result.source).toContain('Phillips');
  });

  it('deficit goals always have min < max', () => {
    const goals = ['fat_loss_moderate', 'fat_loss_aggressive'] as const;
    for (const g of goals) {
      const result = getCalorieRecommendation(tdee, g);
      expect(result.min_kcal).toBeLessThan(result.max_kcal);
    }
  });

  it('surplus goals always have min < max', () => {
    const goals = ['lean_bulk', 'bulk'] as const;
    for (const g of goals) {
      const result = getCalorieRecommendation(tdee, g);
      expect(result.min_kcal).toBeLessThan(result.max_kcal);
    }
  });
});

// ── Calorie Balance ──────────────────────────────────────────────────

describe('calculateCalorieBalance', () => {
  it('classifies deficit when consumed < TDEE - 100', () => {
    const result = calculateCalorieBalance(1800, 2500);
    expect(result.balance).toBe(-700);
    expect(result.status).toBe('deficit');
  });

  it('classifies surplus when consumed > TDEE + 100', () => {
    const result = calculateCalorieBalance(3000, 2500);
    expect(result.balance).toBe(500);
    expect(result.status).toBe('surplus');
  });

  it('classifies maintenance when within ±100', () => {
    expect(calculateCalorieBalance(2500, 2500).status).toBe('maintenance');
    expect(calculateCalorieBalance(2550, 2500).status).toBe('maintenance');
    expect(calculateCalorieBalance(2450, 2500).status).toBe('maintenance');
  });

  it('boundary: -100 is maintenance', () => {
    const result = calculateCalorieBalance(2400, 2500);
    expect(result.balance).toBe(-100);
    expect(result.status).toBe('maintenance');
  });

  it('boundary: -101 is deficit', () => {
    const result = calculateCalorieBalance(2399, 2500);
    expect(result.balance).toBe(-101);
    expect(result.status).toBe('deficit');
  });

  it('boundary: +100 is maintenance', () => {
    const result = calculateCalorieBalance(2600, 2500);
    expect(result.balance).toBe(100);
    expect(result.status).toBe('maintenance');
  });

  it('boundary: +101 is surplus', () => {
    const result = calculateCalorieBalance(2601, 2500);
    expect(result.balance).toBe(101);
    expect(result.status).toBe('surplus');
  });

  it('returns rounded balance', () => {
    const result = calculateCalorieBalance(1800, 2500);
    expect(Number.isInteger(result.balance)).toBe(true);
  });

  it('handles zero intake', () => {
    const result = calculateCalorieBalance(0, 2500);
    expect(result.balance).toBe(-2500);
    expect(result.status).toBe('deficit');
  });
});
