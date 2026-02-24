import { describe, it, expect } from 'vitest';
import {
  planToShareJSON,
  planToText,
  planToBase64,
  planToShareURL,
} from '../exportTrainingPlan';
import type { TrainingPlan } from '../../../../types/health';

// ── Test Fixtures ────────────────────────────────────────────────────

function makeStrengthPlan(): TrainingPlan {
  return {
    id: 'plan-1',
    user_id: 'user-1',
    name: 'Push/Pull/Legs',
    split_type: 'ppl',
    days_per_week: 6,
    is_active: true,
    notes: 'Hypertrophie-Fokus',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    days: [
      {
        id: 'day-1',
        plan_id: 'plan-1',
        day_number: 1,
        name: 'Push A',
        focus: 'Brust & Schultern',
        exercises: [
          { name: 'Bankdrücken', sets: 4, reps: '8-10', weight_kg: 80, rest_seconds: 120 },
          { name: 'Schulterdrücken', sets: 3, reps: '10-12', weight_kg: 40 },
        ],
        created_at: '2026-01-01',
      },
    ],
  };
}

function makeEndurancePlan(): TrainingPlan {
  return {
    id: 'plan-2',
    user_id: 'user-1',
    name: '5K Laufplan',
    split_type: 'running',
    days_per_week: 3,
    is_active: true,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    days: [
      {
        id: 'day-1',
        plan_id: 'plan-2',
        day_number: 1,
        name: 'Easy Run',
        focus: 'Grundlagenausdauer',
        exercises: [
          {
            name: 'Joggen',
            duration_minutes: 30,
            distance_km: 5,
            pace: '6:00 min/km',
            intensity: 'Zone 2',
            exercise_type: 'cardio',
          },
        ],
        notes: 'Locker laufen',
        created_at: '2026-01-01',
      },
    ],
  };
}

function makeMinimalPlan(): TrainingPlan {
  return {
    id: 'plan-3',
    user_id: 'user-1',
    name: 'Minimal',
    split_type: 'custom',
    days_per_week: 1,
    is_active: true,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    days: [],
  };
}

// ── planToShareJSON ──────────────────────────────────────────────────

describe('planToShareJSON', () => {
  it('returns valid JSON string', () => {
    const json = planToShareJSON(makeStrengthPlan());
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('uses compact keys (n, s, d, no, days)', () => {
    const parsed = JSON.parse(planToShareJSON(makeStrengthPlan()));
    expect(parsed.n).toBe('Push/Pull/Legs');
    expect(parsed.s).toBe('ppl');
    expect(parsed.d).toBe(6);
    expect(parsed.no).toBe('Hypertrophie-Fokus');
    expect(parsed.days).toHaveLength(1);
  });

  it('strips user-specific fields (id, user_id, is_active, created_at)', () => {
    const json = planToShareJSON(makeStrengthPlan());
    expect(json).not.toContain('plan-1');
    expect(json).not.toContain('user-1');
    expect(json).not.toContain('is_active');
    expect(json).not.toContain('created_at');
    expect(json).not.toContain('updated_at');
  });

  it('includes day details with compact keys', () => {
    const parsed = JSON.parse(planToShareJSON(makeStrengthPlan()));
    const day = parsed.days[0];
    expect(day.dn).toBe(1);
    expect(day.nm).toBe('Push A');
    expect(day.f).toBe('Brust & Schultern');
    expect(day.ex).toHaveLength(2);
  });

  it('includes exercise fields with compact keys', () => {
    const parsed = JSON.parse(planToShareJSON(makeStrengthPlan()));
    const ex = parsed.days[0].ex[0];
    expect(ex.n).toBe('Bankdrücken');
    expect(ex.s).toBe(4);
    expect(ex.r).toBe('8-10');
    expect(ex.w).toBe(80);
    expect(ex.rs).toBe(120);
  });

  it('includes endurance fields for cardio exercises', () => {
    const parsed = JSON.parse(planToShareJSON(makeEndurancePlan()));
    const ex = parsed.days[0].ex[0];
    expect(ex.n).toBe('Joggen');
    expect(ex.dm).toBe(30);
    expect(ex.dk).toBe(5);
    expect(ex.p).toBe('6:00 min/km');
    expect(ex.i).toBe('Zone 2');
    expect(ex.et).toBe('cardio');
  });

  it('omits undefined/null optional fields', () => {
    const parsed = JSON.parse(planToShareJSON(makeMinimalPlan()));
    expect(parsed.no).toBeUndefined();
    expect(parsed.days).toHaveLength(0);
  });

  it('omits notes from exercises when not present', () => {
    const parsed = JSON.parse(planToShareJSON(makeStrengthPlan()));
    const ex = parsed.days[0].ex[0];
    expect(ex.no).toBeUndefined();
  });
});

// ── planToText ───────────────────────────────────────────────────────

describe('planToText', () => {
  it('starts with plan name and emoji', () => {
    const text = planToText(makeStrengthPlan(), 'de');
    expect(text).toContain('📋 Push/Pull/Legs');
  });

  it('includes days per week (German)', () => {
    const text = planToText(makeStrengthPlan(), 'de');
    expect(text).toContain('6x / Woche');
  });

  it('includes days per week (English)', () => {
    const text = planToText(makeStrengthPlan(), 'en');
    expect(text).toContain('6x / Week');
  });

  it('includes plan notes', () => {
    const text = planToText(makeStrengthPlan(), 'de');
    expect(text).toContain('Hypertrophie-Fokus');
  });

  it('includes day headers with number and name (German)', () => {
    const text = planToText(makeStrengthPlan(), 'de');
    expect(text).toContain('Tag 1: Push A');
  });

  it('includes day headers (English)', () => {
    const text = planToText(makeStrengthPlan(), 'en');
    expect(text).toContain('Day 1: Push A');
  });

  it('includes focus with emoji', () => {
    const text = planToText(makeStrengthPlan(), 'de');
    expect(text).toContain('🎯 Brust & Schultern');
  });

  it('includes numbered exercises', () => {
    const text = planToText(makeStrengthPlan(), 'de');
    expect(text).toContain('1. Bankdrücken');
    expect(text).toContain('2. Schulterdrücken');
  });

  it('includes exercise details for strength (sets×reps, weight)', () => {
    const text = planToText(makeStrengthPlan(), 'de');
    expect(text).toContain('4×8-10');
    expect(text).toContain('80kg');
  });

  it('includes exercise details for endurance (duration, distance, pace, intensity)', () => {
    const text = planToText(makeEndurancePlan(), 'de');
    expect(text).toContain('30 Min');
    expect(text).toContain('5 km');
    expect(text).toContain('@ 6:00 min/km');
    expect(text).toContain('(Zone 2)');
  });

  it('includes day notes with emoji', () => {
    const text = planToText(makeEndurancePlan(), 'de');
    expect(text).toContain('📝 Locker laufen');
  });

  it('ends with FitBuddy branding (German)', () => {
    const text = planToText(makeStrengthPlan(), 'de');
    expect(text).toContain('Erstellt mit FitBuddy 💪');
  });

  it('ends with FitBuddy branding (English)', () => {
    const text = planToText(makeStrengthPlan(), 'en');
    expect(text).toContain('Made with FitBuddy 💪');
  });

  it('handles plan with no days', () => {
    const text = planToText(makeMinimalPlan(), 'de');
    expect(text).toContain('📋 Minimal');
    expect(text).toContain('Erstellt mit FitBuddy');
  });
});

// ── planToBase64 ─────────────────────────────────────────────────────

describe('planToBase64', () => {
  it('returns a non-empty string', () => {
    const b64 = planToBase64(makeStrengthPlan());
    expect(b64.length).toBeGreaterThan(0);
  });

  it('returns valid base64 (decodable)', () => {
    const b64 = planToBase64(makeStrengthPlan());
    expect(() => atob(b64)).not.toThrow();
  });

  it('round-trips back to original JSON', () => {
    const plan = makeStrengthPlan();
    const b64 = planToBase64(plan);
    const decoded = decodeURIComponent(escape(atob(b64)));
    const parsed = JSON.parse(decoded);
    expect(parsed.n).toBe('Push/Pull/Legs');
    expect(parsed.s).toBe('ppl');
    expect(parsed.d).toBe(6);
  });

  it('handles Umlauts correctly (Bankdrücken)', () => {
    const b64 = planToBase64(makeStrengthPlan());
    const decoded = decodeURIComponent(escape(atob(b64)));
    expect(decoded).toContain('Bankdrücken');
  });
});

// ── planToShareURL ───────────────────────────────────────────────────

describe('planToShareURL', () => {
  it('contains /import-plan# path', () => {
    const url = planToShareURL(makeStrengthPlan());
    expect(url).toContain('/import-plan#');
  });

  it('contains base64 data after hash', () => {
    const url = planToShareURL(makeStrengthPlan());
    const hash = url.split('#')[1];
    expect(hash.length).toBeGreaterThan(0);
    expect(() => atob(hash)).not.toThrow();
  });

  it('starts with an origin URL', () => {
    const url = planToShareURL(makeStrengthPlan());
    expect(url).toMatch(/^https?:\/\//);
  });

  it('produces different URLs for different plans', () => {
    const url1 = planToShareURL(makeStrengthPlan());
    const url2 = planToShareURL(makeEndurancePlan());
    expect(url1).not.toBe(url2);
  });

  it('minimal plan produces shorter URL', () => {
    const url1 = planToShareURL(makeStrengthPlan());
    const url2 = planToShareURL(makeMinimalPlan());
    expect(url2.length).toBeLessThan(url1.length);
  });
});
