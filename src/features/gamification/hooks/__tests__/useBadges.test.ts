import { describe, it, expect } from 'vitest';
import { evaluateBadges, BADGE_DEFINITIONS, type BadgeStats } from '../useBadges';

// ── Helper: build stats ──────────────────────────────────────────────

function makeStats(overrides: Partial<BadgeStats> = {}): BadgeStats {
  return {
    currentStreak: 0,
    longestStreak: 0,
    totalActiveDays: 0,
    totalMealDays: 0,
    totalWorkouts: 0,
    totalBodyMeasurements: 0,
    ...overrides,
  };
}

// ── Badge definitions ────────────────────────────────────────────────

describe('BADGE_DEFINITIONS', () => {
  it('has exactly 12 badges', () => {
    expect(BADGE_DEFINITIONS).toHaveLength(12);
  });

  it('all badges have unique IDs', () => {
    const ids = BADGE_DEFINITIONS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all badges have required fields', () => {
    BADGE_DEFINITIONS.forEach((b) => {
      expect(b.id).toBeTruthy();
      expect(b.icon).toBeTruthy();
      expect(b.nameKey).toBeTruthy();
      expect(b.descriptionKey).toBeTruthy();
      expect(typeof b.condition).toBe('function');
    });
  });
});

// ── evaluateBadges — no activity ─────────────────────────────────────

describe('evaluateBadges — no activity', () => {
  it('returns all badges as unearned when stats are zero', () => {
    const badges = evaluateBadges(makeStats());
    // photos_5 is always false, all others should also be false
    badges.forEach((b) => {
      expect(b.earned).toBe(false);
    });
  });

  it('returns correct number of badges', () => {
    const badges = evaluateBadges(makeStats());
    expect(badges).toHaveLength(12);
  });
});

// ── evaluateBadges — first day ───────────────────────────────────────

describe('evaluateBadges — first day badge', () => {
  it('earns first_day badge with 1 active day', () => {
    const badges = evaluateBadges(makeStats({ totalActiveDays: 1 }));
    const firstDay = badges.find((b) => b.id === 'first_day');
    expect(firstDay?.earned).toBe(true);
  });
});

// ── evaluateBadges — streak badges ───────────────────────────────────

describe('evaluateBadges — streak badges', () => {
  it('earns streak_3 badge with longestStreak >= 3', () => {
    const badges = evaluateBadges(makeStats({ longestStreak: 3, totalActiveDays: 3 }));
    expect(badges.find((b) => b.id === 'streak_3')?.earned).toBe(true);
    expect(badges.find((b) => b.id === 'streak_7')?.earned).toBe(false);
  });

  it('earns streak_7 badge with longestStreak >= 7', () => {
    const badges = evaluateBadges(makeStats({ longestStreak: 7, totalActiveDays: 7 }));
    expect(badges.find((b) => b.id === 'streak_3')?.earned).toBe(true);
    expect(badges.find((b) => b.id === 'streak_7')?.earned).toBe(true);
    expect(badges.find((b) => b.id === 'streak_30')?.earned).toBe(false);
  });

  it('earns streak_30 badge with longestStreak >= 30', () => {
    const badges = evaluateBadges(makeStats({ longestStreak: 30, totalActiveDays: 30 }));
    expect(badges.find((b) => b.id === 'streak_3')?.earned).toBe(true);
    expect(badges.find((b) => b.id === 'streak_7')?.earned).toBe(true);
    expect(badges.find((b) => b.id === 'streak_30')?.earned).toBe(true);
  });
});

// ── evaluateBadges — workout badges ──────────────────────────────────

describe('evaluateBadges — workout badges', () => {
  it('earns first_workout badge with 1 workout', () => {
    const badges = evaluateBadges(makeStats({ totalWorkouts: 1 }));
    expect(badges.find((b) => b.id === 'first_workout')?.earned).toBe(true);
    expect(badges.find((b) => b.id === 'workouts_10')?.earned).toBe(false);
  });

  it('earns workouts_10 badge with 10 workouts', () => {
    const badges = evaluateBadges(makeStats({ totalWorkouts: 10 }));
    expect(badges.find((b) => b.id === 'first_workout')?.earned).toBe(true);
    expect(badges.find((b) => b.id === 'workouts_10')?.earned).toBe(true);
    expect(badges.find((b) => b.id === 'workouts_50')?.earned).toBe(false);
  });

  it('earns workouts_50 badge with 50 workouts', () => {
    const badges = evaluateBadges(makeStats({ totalWorkouts: 50 }));
    expect(badges.find((b) => b.id === 'workouts_50')?.earned).toBe(true);
  });
});

// ── evaluateBadges — meal badges ─────────────────────────────────────

describe('evaluateBadges — meal badges', () => {
  it('earns meal_7 badge with 7 meal days', () => {
    const badges = evaluateBadges(makeStats({ totalMealDays: 7 }));
    expect(badges.find((b) => b.id === 'meal_7')?.earned).toBe(true);
    expect(badges.find((b) => b.id === 'meal_30')?.earned).toBe(false);
  });

  it('earns meal_30 badge with 30 meal days', () => {
    const badges = evaluateBadges(makeStats({ totalMealDays: 30 }));
    expect(badges.find((b) => b.id === 'meal_7')?.earned).toBe(true);
    expect(badges.find((b) => b.id === 'meal_30')?.earned).toBe(true);
  });
});

// ── evaluateBadges — body measurement badge ──────────────────────────

describe('evaluateBadges — body measurement badge', () => {
  it('earns body_10 badge with 10 measurements', () => {
    const badges = evaluateBadges(makeStats({ totalBodyMeasurements: 10 }));
    expect(badges.find((b) => b.id === 'body_10')?.earned).toBe(true);
  });

  it('does not earn body_10 badge with 9 measurements', () => {
    const badges = evaluateBadges(makeStats({ totalBodyMeasurements: 9 }));
    expect(badges.find((b) => b.id === 'body_10')?.earned).toBe(false);
  });
});

// ── evaluateBadges — champion badge ──────────────────────────────────

describe('evaluateBadges — champion badge', () => {
  it('earns champion badge with 100 active days', () => {
    const badges = evaluateBadges(makeStats({ totalActiveDays: 100 }));
    expect(badges.find((b) => b.id === 'champion')?.earned).toBe(true);
  });

  it('does not earn champion badge with 99 active days', () => {
    const badges = evaluateBadges(makeStats({ totalActiveDays: 99 }));
    expect(badges.find((b) => b.id === 'champion')?.earned).toBe(false);
  });
});

// ── evaluateBadges — photos badge (always locked) ────────────────────

describe('evaluateBadges — photos badge', () => {
  it('photos_5 badge is always unearned (no photos table yet)', () => {
    const badges = evaluateBadges(makeStats({
      totalActiveDays: 1000,
      totalWorkouts: 1000,
      totalMealDays: 1000,
      totalBodyMeasurements: 1000,
      longestStreak: 1000,
    }));
    expect(badges.find((b) => b.id === 'photos_5')?.earned).toBe(false);
  });
});

// ── evaluateBadges — combined stats ──────────────────────────────────

describe('evaluateBadges — combined stats', () => {
  it('multiple badges earned at once', () => {
    const badges = evaluateBadges(makeStats({
      currentStreak: 10,
      longestStreak: 10,
      totalActiveDays: 10,
      totalMealDays: 10,
      totalWorkouts: 15,
      totalBodyMeasurements: 12,
    }));

    const earned = badges.filter((b) => b.earned).map((b) => b.id);
    expect(earned).toContain('first_day');
    expect(earned).toContain('streak_3');
    expect(earned).toContain('streak_7');
    expect(earned).toContain('first_workout');
    expect(earned).toContain('workouts_10');
    expect(earned).toContain('meal_7');
    expect(earned).toContain('body_10');
    expect(earned).not.toContain('streak_30');
    expect(earned).not.toContain('workouts_50');
    expect(earned).not.toContain('champion');
  });
});
