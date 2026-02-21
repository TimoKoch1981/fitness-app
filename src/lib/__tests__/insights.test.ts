import { describe, it, expect } from 'vitest';
import { generateInsights } from '../insights';
import type { InsightInput } from '../insights';

// ── Helper ──────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<InsightInput> = {}): InsightInput {
  return {
    caloriesConsumed: 0,
    caloriesGoal: 2000,
    caloriesBurned: 0,
    proteinConsumed: 0,
    proteinGoal: 150,
    waterGlasses: 4,
    waterGoal: 8,
    bodyMeasurements: [],
    bpLogs: [],
    hasProfile: true,
    hasSubstances: false,
    workoutCountToday: 0,
    ...overrides,
  };
}

// ── Blood Pressure Insights ─────────────────────────────────────────────

describe('generateInsights — blood pressure', () => {
  it('returns optimal BP insight for 115/75', () => {
    const input = makeInput({
      bpLogs: [{ systolic: 115, diastolic: 75, date: '2026-02-21' } as any],
    });
    const insights = generateInsights(input);
    const bpGood = insights.find(i => i.id === 'bp_good');
    expect(bpGood).toBeDefined();
    expect(bpGood!.severity).toBe('success');
  });

  it('returns high-normal BP insight for 135/82', () => {
    const input = makeInput({
      bpLogs: [{ systolic: 135, diastolic: 82, date: '2026-02-21' } as any],
    });
    const insights = generateInsights(input);
    const bpHighNormal = insights.find(i => i.id === 'bp_high_normal');
    expect(bpHighNormal).toBeDefined();
    expect(bpHighNormal!.severity).toBe('info');
  });

  it('returns elevated BP warning for 155/95', () => {
    const input = makeInput({
      bpLogs: [{ systolic: 155, diastolic: 95, date: '2026-02-21' } as any],
    });
    const insights = generateInsights(input);
    const bpHigh = insights.find(i => i.id === 'bp_high');
    expect(bpHigh).toBeDefined();
    expect(bpHigh!.severity).toBe('warning');
  });

  it('returns critical BP for 180/110', () => {
    const input = makeInput({
      bpLogs: [{ systolic: 180, diastolic: 110, date: '2026-02-21' } as any],
    });
    const insights = generateInsights(input);
    const bpHigh = insights.find(i => i.id === 'bp_high');
    expect(bpHigh).toBeDefined();
    expect(bpHigh!.severity).toBe('critical');
    expect(bpHigh!.priority).toBe(0);
  });

  it('returns no BP insight when no BP data', () => {
    const input = makeInput({ bpLogs: [] });
    const insights = generateInsights(input);
    const bpInsights = insights.filter(i => i.category === 'bp_warning' || i.category === 'bp_trend');
    expect(bpInsights).toHaveLength(0);
  });
});

// ── Calorie Insights ────────────────────────────────────────────────────

describe('generateInsights — calories', () => {
  it('returns surplus warning when >300 kcal over', () => {
    const input = makeInput({ caloriesConsumed: 2500, caloriesGoal: 2000, caloriesBurned: 0 });
    const insights = generateInsights(input);
    const calOver = insights.find(i => i.id === 'cal_over');
    expect(calOver).toBeDefined();
    expect(calOver!.severity).toBe('warning');
  });

  it('returns very low warning when >800 kcal under', () => {
    const input = makeInput({ caloriesConsumed: 800, caloriesGoal: 2000, caloriesBurned: 0 });
    const insights = generateInsights(input);
    const calLow = insights.find(i => i.id === 'cal_very_low');
    expect(calLow).toBeDefined();
  });

  it('returns perfect when within ±100 kcal', () => {
    const input = makeInput({ caloriesConsumed: 2050, caloriesGoal: 2000, caloriesBurned: 0 });
    const insights = generateInsights(input);
    const calPerfect = insights.find(i => i.id === 'cal_perfect');
    expect(calPerfect).toBeDefined();
    expect(calPerfect!.severity).toBe('success');
  });

  it('returns no calorie insight when nothing eaten', () => {
    const input = makeInput({ caloriesConsumed: 0 });
    const insights = generateInsights(input);
    const calInsights = insights.filter(i => i.category === 'calorie_balance');
    expect(calInsights).toHaveLength(0);
  });
});

// ── Protein Insights ────────────────────────────────────────────────────

describe('generateInsights — protein', () => {
  it('returns protein warning when <50%', () => {
    const input = makeInput({ proteinConsumed: 40, proteinGoal: 150 });
    const insights = generateInsights(input);
    const protLow = insights.find(i => i.id === 'protein_low');
    expect(protLow).toBeDefined();
    expect(protLow!.severity).toBe('warning');
  });

  it('mentions substances when hasSubstances is true', () => {
    const input = makeInput({ proteinConsumed: 40, proteinGoal: 150, hasSubstances: true });
    const insights = generateInsights(input);
    const protLow = insights.find(i => i.id === 'protein_low');
    expect(protLow!.message.de).toContain('Substanzeinnahme');
  });

  it('returns protein good when 90-120%', () => {
    const input = makeInput({ proteinConsumed: 145, proteinGoal: 150 });
    const insights = generateInsights(input);
    const protGood = insights.find(i => i.id === 'protein_good');
    expect(protGood).toBeDefined();
    expect(protGood!.severity).toBe('success');
  });
});

// ── Weight Trend ────────────────────────────────────────────────────────

describe('generateInsights — weight trend', () => {
  it('detects rapid weight loss', () => {
    const input = makeInput({
      bodyMeasurements: [
        { weight_kg: 88, date: '2026-02-21' } as any,
        { weight_kg: 92, date: '2026-02-14' } as any,
      ],
    });
    const insights = generateInsights(input);
    const weightLoss = insights.find(i => i.id === 'weight_loss_fast');
    expect(weightLoss).toBeDefined();
    expect(weightLoss!.severity).toBe('warning');
  });

  it('detects rapid weight gain', () => {
    const input = makeInput({
      bodyMeasurements: [
        { weight_kg: 95, date: '2026-02-21' } as any,
        { weight_kg: 90, date: '2026-02-14' } as any,
      ],
    });
    const insights = generateInsights(input);
    const weightGain = insights.find(i => i.id === 'weight_gain_fast');
    expect(weightGain).toBeDefined();
  });

  it('needs at least 2 measurements', () => {
    const input = makeInput({
      bodyMeasurements: [{ weight_kg: 90, date: '2026-02-21' } as any],
    });
    const insights = generateInsights(input);
    const weightInsights = insights.filter(i => i.category === 'weight_trend');
    expect(weightInsights).toHaveLength(0);
  });
});

// ── Missing Data ────────────────────────────────────────────────────────

describe('generateInsights — missing data', () => {
  it('suggests profile completion when hasProfile is false', () => {
    const input = makeInput({ hasProfile: false });
    const insights = generateInsights(input);
    const noProfile = insights.find(i => i.id === 'no_profile');
    expect(noProfile).toBeDefined();
  });

  it('warns about BP when hasSubstances but no BP data', () => {
    const input = makeInput({ hasSubstances: true, bpLogs: [] });
    const insights = generateInsights(input);
    const noBP = insights.find(i => i.id === 'no_bp_with_subs');
    expect(noBP).toBeDefined();
    expect(noBP!.severity).toBe('warning');
  });
});

// ── Sorting ─────────────────────────────────────────────────────────────

describe('generateInsights — sorting', () => {
  it('sorts insights by priority (ascending)', () => {
    const input = makeInput({
      caloriesConsumed: 2500,
      proteinConsumed: 40,
      bpLogs: [{ systolic: 160, diastolic: 100, date: '2026-02-21' } as any],
    });
    const insights = generateInsights(input);
    for (let i = 1; i < insights.length; i++) {
      expect(insights[i].priority).toBeGreaterThanOrEqual(insights[i - 1].priority);
    }
  });
});
