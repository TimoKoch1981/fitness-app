import { describe, it, expect } from 'vitest';
import {
  analyzeDeviations,
  formatDeviationsForAgent,
  getDeviationSuggestions,
} from '../deviations';
import type { HealthContext, DailyCheckin } from '../../../types/health';

// ── Helpers ─────────────────────────────────────────────────────────────

function makeCheckin(overrides: Partial<DailyCheckin> = {}): DailyCheckin {
  return {
    id: 'test',
    user_id: 'u1',
    date: new Date().toISOString().split('T')[0],
    pain_areas: [],
    illness: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeContext(overrides: Partial<HealthContext> = {}): Partial<HealthContext> {
  return {
    dailyStats: {
      calories: 1500,
      caloriesGoal: 2000,
      protein: 100,
      proteinGoal: 150,
      carbs: 150,
      fat: 50,
      water: 4,
      waterGoal: 8,
    },
    recentBloodPressure: [],
    recentWorkouts: [],
    ...overrides,
  };
}

// ── analyzeDeviations ───────────────────────────────────────────────────

describe('analyzeDeviations', () => {
  it('returns empty array when no issues', () => {
    const result = analyzeDeviations(makeContext(), makeCheckin({ energy_level: 4, sleep_quality: 4 }));
    // With default context + healthy checkin: no illness, no pain, energy OK, sleep OK, stress OK
    // BP is empty, workouts empty, nutrition thresholds not exceeded
    const warnings = result.filter(d => d.type === 'warning');
    // Should not have illness/pain/bp warnings
    expect(warnings.filter(d => d.message.includes('krank') || d.message.includes('Krankheit'))).toHaveLength(0);
  });

  it('detects illness → training warning + nutrition info', () => {
    const result = analyzeDeviations(makeContext(), makeCheckin({ illness: true }));
    const trainingWarning = result.find(d => d.agent === 'training' && d.message.includes('Krankheit'));
    const nutritionInfo = result.find(d => d.agent === 'nutrition' && d.message.includes('krank'));
    expect(trainingWarning).toBeDefined();
    expect(trainingWarning!.type).toBe('warning');
    expect(trainingWarning!.priority).toBe(1);
    expect(nutritionInfo).toBeDefined();
    expect(nutritionInfo!.type).toBe('info');
  });

  it('detects low energy (≤2) with active plan → suggestion', () => {
    const ctx = makeContext({ activePlan: { id: 'p1', name: 'Test Plan' } as any });
    const result = analyzeDeviations(ctx, makeCheckin({ energy_level: 2 }));
    const energySuggestion = result.find(d => d.agent === 'training' && d.message.includes('Energie'));
    expect(energySuggestion).toBeDefined();
    expect(energySuggestion!.type).toBe('suggestion');
  });

  it('does NOT flag low energy when no active plan', () => {
    const result = analyzeDeviations(makeContext(), makeCheckin({ energy_level: 1 }));
    const energySuggestion = result.find(d => d.message.includes('Energie'));
    expect(energySuggestion).toBeUndefined();
  });

  it('detects poor sleep (≤2) → recovery info', () => {
    const result = analyzeDeviations(makeContext(), makeCheckin({ sleep_quality: 1 }));
    const sleepInfo = result.find(d => d.message.includes('Schlafqualitaet'));
    expect(sleepInfo).toBeDefined();
    expect(sleepInfo!.agent).toBe('training');
    expect(sleepInfo!.type).toBe('info');
  });

  it('detects high stress (≥4) → cortisol info', () => {
    const result = analyzeDeviations(makeContext(), makeCheckin({ stress_level: 4 }));
    const stressInfo = result.find(d => d.message.includes('Stress'));
    expect(stressInfo).toBeDefined();
    expect(stressInfo!.agent).toBe('training');
  });

  it('detects pain areas → training warning + medical info', () => {
    const result = analyzeDeviations(makeContext(), makeCheckin({ pain_areas: ['Schulter', 'Knie'] }));
    const trainingPain = result.find(d => d.agent === 'training' && d.message.includes('Schmerzen'));
    const medicalPain = result.find(d => d.agent === 'medical' && d.message.includes('Schmerzen'));
    expect(trainingPain).toBeDefined();
    expect(trainingPain!.message).toContain('Schulter');
    expect(trainingPain!.message).toContain('Knie');
    expect(medicalPain).toBeDefined();
  });

  it('detects protein <60% at calories >70% → nutrition warning', () => {
    const ctx = makeContext({
      dailyStats: {
        calories: 1600, caloriesGoal: 2000, // 80% → >70%
        protein: 50, proteinGoal: 150,       // 33% → <60%
        carbs: 200, fat: 60, water: 4, waterGoal: 8,
      },
    });
    const result = analyzeDeviations(ctx, null);
    const proteinWarning = result.find(d => d.agent === 'nutrition' && d.message.includes('Protein'));
    expect(proteinWarning).toBeDefined();
    expect(proteinWarning!.type).toBe('warning');
  });

  it('does NOT flag protein when calories are also low', () => {
    const ctx = makeContext({
      dailyStats: {
        calories: 500, caloriesGoal: 2000, // 25% → <70%
        protein: 30, proteinGoal: 150,
        carbs: 50, fat: 10, water: 2, waterGoal: 8,
      },
    });
    const result = analyzeDeviations(ctx, null);
    const proteinWarning = result.find(d => d.agent === 'nutrition' && d.message.includes('Protein'));
    expect(proteinWarning).toBeUndefined();
  });

  // Blood pressure tests
  it('detects critical blood pressure (≥180/120) → medical warning', () => {
    const ctx = makeContext({
      recentBloodPressure: [{ systolic: 185, diastolic: 125, date: new Date().toISOString() } as any],
    });
    const result = analyzeDeviations(ctx, null);
    const bpCritical = result.find(d => d.message.includes('KRITISCH'));
    expect(bpCritical).toBeDefined();
    expect(bpCritical!.priority).toBe(1);
    expect(bpCritical!.icon).toBe('🚨');
  });

  it('detects elevated blood pressure (≥160/100) → medical + training warning', () => {
    const ctx = makeContext({
      recentBloodPressure: [{ systolic: 165, diastolic: 95, date: new Date().toISOString() } as any],
    });
    const result = analyzeDeviations(ctx, null);
    const medicalBP = result.find(d => d.agent === 'medical' && d.message.includes('erhoet'));
    const trainingBP = result.find(d => d.agent === 'training' && d.message.includes('Valsalva'));
    expect(medicalBP).toBeDefined();
    expect(trainingBP).toBeDefined();
  });

  it('detects high-normal blood pressure (≥130) → medical info', () => {
    const ctx = makeContext({
      recentBloodPressure: [{ systolic: 135, diastolic: 82, date: new Date().toISOString() } as any],
    });
    const result = analyzeDeviations(ctx, null);
    const bpInfo = result.find(d => d.message.includes('hochnormal'));
    expect(bpInfo).toBeDefined();
    expect(bpInfo!.type).toBe('info');
    expect(bpInfo!.priority).toBe(4);
  });

  it('does NOT flag normal blood pressure', () => {
    const ctx = makeContext({
      recentBloodPressure: [{ systolic: 120, diastolic: 78, date: new Date().toISOString() } as any],
    });
    const result = analyzeDeviations(ctx, null);
    const bpDeviation = result.find(d => d.message.includes('Blutdruck'));
    expect(bpDeviation).toBeUndefined();
  });

  it('detects no training ≥3 days → training suggestion', () => {
    const threeDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
    const ctx = makeContext({
      recentWorkouts: [{ date: threeDaysAgo } as any],
    });
    const result = analyzeDeviations(ctx, null);
    const nudge = result.find(d => d.message.includes('Tagen'));
    expect(nudge).toBeDefined();
    expect(nudge!.type).toBe('suggestion');
  });

  it('does NOT nudge for training if user is sick', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const ctx = makeContext({
      recentWorkouts: [{ date: fiveDaysAgo } as any],
    });
    const result = analyzeDeviations(ctx, makeCheckin({ illness: true }));
    const nudge = result.find(d => d.message.includes('Tagen'));
    expect(nudge).toBeUndefined();
  });

  it('returns deviations sorted by priority (ascending)', () => {
    const ctx = makeContext({
      recentBloodPressure: [{ systolic: 190, diastolic: 125, date: new Date().toISOString() } as any],
    });
    const result = analyzeDeviations(ctx, makeCheckin({ illness: true, stress_level: 5 }));
    expect(result.length).toBeGreaterThan(2);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].priority).toBeGreaterThanOrEqual(result[i - 1].priority);
    }
  });

  it('returns empty array with empty context', () => {
    const result = analyzeDeviations({}, null);
    expect(result).toEqual([]);
  });
});

// ── formatDeviationsForAgent ────────────────────────────────────────────

describe('formatDeviationsForAgent', () => {
  it('filters deviations by agent type', () => {
    const ctx = makeContext({
      recentBloodPressure: [{ systolic: 170, diastolic: 105, date: new Date().toISOString() } as any],
    });
    const deviations = analyzeDeviations(ctx, makeCheckin({ illness: true }));

    const trainingBlock = formatDeviationsForAgent(deviations, 'training', 'de');
    const medicalBlock = formatDeviationsForAgent(deviations, 'medical', 'de');
    const nutritionBlock = formatDeviationsForAgent(deviations, 'nutrition', 'de');

    expect(trainingBlock).toContain('Krankheit');
    expect(trainingBlock).toContain('Valsalva');
    expect(medicalBlock).toContain('erhoet');
    expect(nutritionBlock).toContain('krank');
  });

  it('returns empty string when no relevant deviations', () => {
    const deviations = analyzeDeviations(makeContext(), makeCheckin({ energy_level: 4 }));
    const beautyBlock = formatDeviationsForAgent(deviations, 'beauty', 'de');
    expect(beautyBlock).toBe('');
  });

  it('outputs German labels by default', () => {
    const deviations = analyzeDeviations(makeContext(), makeCheckin({ illness: true }));
    const block = formatDeviationsForAgent(deviations, 'training', 'de');
    expect(block).toContain('AKTUELLE HINWEISE');
    expect(block).toContain('WARNUNG');
  });

  it('outputs English labels when language is en', () => {
    const deviations = analyzeDeviations(makeContext(), makeCheckin({ illness: true }));
    const block = formatDeviationsForAgent(deviations, 'training', 'en');
    expect(block).toContain('CURRENT ALERTS');
    expect(block).toContain('illness');
  });
});

// ── getDeviationSuggestions ─────────────────────────────────────────────

describe('getDeviationSuggestions', () => {
  it('generates illness chip', () => {
    const deviations = analyzeDeviations(makeContext(), makeCheckin({ illness: true }));
    const chips = getDeviationSuggestions(deviations, 'de');
    const illnessChip = chips.find(c => c.id === 'dev_illness');
    expect(illnessChip).toBeDefined();
    expect(illnessChip!.icon).toBe('🤒');
  });

  it('generates BP chip', () => {
    const ctx = makeContext({
      recentBloodPressure: [{ systolic: 180, diastolic: 120, date: new Date().toISOString() } as any],
    });
    const deviations = analyzeDeviations(ctx, null);
    const chips = getDeviationSuggestions(deviations, 'de');
    const bpChip = chips.find(c => c.id === 'dev_bp');
    expect(bpChip).toBeDefined();
  });

  it('limits to max 3 chips', () => {
    const ctx = makeContext({
      recentBloodPressure: [{ systolic: 185, diastolic: 125, date: new Date().toISOString() } as any],
    });
    const deviations = analyzeDeviations(ctx, makeCheckin({
      illness: true,
      energy_level: 1,
      stress_level: 5,
      pain_areas: ['Rücken'],
    }));
    const chips = getDeviationSuggestions(deviations, 'de');
    expect(chips.length).toBeLessThanOrEqual(3);
  });

  it('returns empty for healthy user', () => {
    const chips = getDeviationSuggestions([], 'de');
    expect(chips).toHaveLength(0);
  });

  it('uses English labels when language is en', () => {
    const deviations = analyzeDeviations(makeContext(), makeCheckin({ illness: true }));
    const chips = getDeviationSuggestions(deviations, 'en');
    const illnessChip = chips.find(c => c.id === 'dev_illness');
    expect(illnessChip?.label).toContain('sick');
  });
});
