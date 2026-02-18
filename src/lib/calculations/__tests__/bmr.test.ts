import { describe, it, expect } from 'vitest';
import {
  calculateBMR_MifflinStJeor,
  calculateBMR_KatchMcArdle,
  calculateBMI,
  calculateAge,
  calculateLeanMass,
  calculateBMR,
} from '../bmr';

describe('calculateBMR_MifflinStJeor', () => {
  it('calculates BMR for a male (80kg, 180cm, 40y)', () => {
    // 10*80 + 6.25*180 - 5*40 + 5 = 800 + 1125 - 200 + 5 = 1730
    expect(calculateBMR_MifflinStJeor({
      weight_kg: 80, height_cm: 180, age: 40, gender: 'male',
    })).toBe(1730);
  });

  it('calculates BMR for a female (60kg, 165cm, 30y)', () => {
    // 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320
    expect(calculateBMR_MifflinStJeor({
      weight_kg: 60, height_cm: 165, age: 30, gender: 'female',
    })).toBe(1320);
  });

  it('returns higher BMR for heavier person', () => {
    const light = calculateBMR_MifflinStJeor({
      weight_kg: 60, height_cm: 175, age: 30, gender: 'male',
    });
    const heavy = calculateBMR_MifflinStJeor({
      weight_kg: 100, height_cm: 175, age: 30, gender: 'male',
    });
    expect(heavy).toBeGreaterThan(light);
  });

  it('returns lower BMR for older person', () => {
    const young = calculateBMR_MifflinStJeor({
      weight_kg: 80, height_cm: 180, age: 25, gender: 'male',
    });
    const old = calculateBMR_MifflinStJeor({
      weight_kg: 80, height_cm: 180, age: 55, gender: 'male',
    });
    expect(young).toBeGreaterThan(old);
  });
});

describe('calculateBMR_KatchMcArdle', () => {
  it('calculates BMR with body fat (80kg, 15% BF)', () => {
    // lean = 80 * (1 - 0.15) = 68
    // BMR = 370 + 21.6 * 68 = 370 + 1468.8 = 1839
    expect(calculateBMR_KatchMcArdle({
      weight_kg: 80, height_cm: 180, age: 40, gender: 'male', body_fat_pct: 15,
    })).toBe(1839);
  });

  it('is gender-neutral (uses lean mass only)', () => {
    const male = calculateBMR_KatchMcArdle({
      weight_kg: 70, height_cm: 170, age: 30, gender: 'male', body_fat_pct: 20,
    });
    const female = calculateBMR_KatchMcArdle({
      weight_kg: 70, height_cm: 170, age: 30, gender: 'female', body_fat_pct: 20,
    });
    expect(male).toBe(female);
  });

  it('returns higher BMR for lower body fat at same weight', () => {
    const lowBF = calculateBMR_KatchMcArdle({
      weight_kg: 80, height_cm: 180, age: 30, gender: 'male', body_fat_pct: 10,
    });
    const highBF = calculateBMR_KatchMcArdle({
      weight_kg: 80, height_cm: 180, age: 30, gender: 'male', body_fat_pct: 25,
    });
    expect(lowBF).toBeGreaterThan(highBF);
  });
});

describe('calculateBMI', () => {
  it('calculates normal BMI (75kg, 180cm)', () => {
    // 75 / (1.8^2) = 75 / 3.24 = 23.15
    expect(calculateBMI(75, 180)).toBe(23.1);
  });

  it('calculates overweight BMI (90kg, 175cm)', () => {
    // 90 / (1.75^2) = 90 / 3.0625 = 29.39
    const bmi = calculateBMI(90, 175);
    expect(bmi).toBeGreaterThanOrEqual(29);
    expect(bmi).toBeLessThan(30);
  });

  it('calculates underweight BMI (50kg, 180cm)', () => {
    // 50 / (1.8^2) = 50 / 3.24 = 15.43
    const bmi = calculateBMI(50, 180);
    expect(bmi).toBeLessThan(18.5);
  });
});

describe('calculateAge', () => {
  it('calculates age correctly for past birthday this year', () => {
    const year = new Date().getFullYear();
    const age = calculateAge(`${year - 40}-01-01`);
    expect(age).toBe(40);
  });

  it('subtracts 1 year if birthday has not happened yet', () => {
    const year = new Date().getFullYear();
    const age = calculateAge(`${year - 30}-12-31`);
    // In most of the year, this person is 29 (birthday Dec 31)
    const today = new Date();
    const expectedAge = today.getMonth() === 11 && today.getDate() >= 31 ? 30 : 29;
    expect(age).toBe(expectedAge);
  });
});

describe('calculateLeanMass', () => {
  it('calculates lean mass (80kg, 20% BF)', () => {
    // 80 * (1 - 0.20) = 64.0
    expect(calculateLeanMass(80, 20)).toBe(64.0);
  });

  it('calculates lean mass (90kg, 15% BF)', () => {
    // 90 * 0.85 = 76.5
    expect(calculateLeanMass(90, 15)).toBe(76.5);
  });
});

describe('calculateBMR (auto-select)', () => {
  const params = { weight_kg: 80, height_cm: 180, age: 40, gender: 'male' as const };

  it('uses Katch-McArdle when body_fat is available and formula is auto', () => {
    const result = calculateBMR({ ...params, body_fat_pct: 15 }, 'auto');
    expect(result.formula).toBe('katch');
  });

  it('uses Mifflin-St Jeor when no body_fat and formula is auto', () => {
    const result = calculateBMR(params, 'auto');
    expect(result.formula).toBe('mifflin');
  });

  it('uses Katch-McArdle when explicitly requested with body_fat', () => {
    const result = calculateBMR({ ...params, body_fat_pct: 15 }, 'katch');
    expect(result.formula).toBe('katch');
  });

  it('falls back to Mifflin when Katch requested but no body_fat', () => {
    const result = calculateBMR(params, 'katch');
    expect(result.formula).toBe('mifflin');
  });

  it('uses Mifflin when explicitly requested', () => {
    const result = calculateBMR({ ...params, body_fat_pct: 15 }, 'mifflin');
    expect(result.formula).toBe('mifflin');
  });

  it('returns a positive BMR number', () => {
    const result = calculateBMR(params);
    expect(result.bmr).toBeGreaterThan(0);
  });
});
