/**
 * Tests for suggestRestTimes utility
 */

import { describe, it, expect } from 'vitest';
import { suggestRestTime } from '../suggestRestTimes';

describe('suggestRestTime', () => {
  describe('compound exercise detection', () => {
    it('detects squat as compound', () => {
      const result = suggestRestTime({ exerciseName: 'Barbell Squat', repsTarget: 8 });
      expect(result.restSeconds).toBe(120); // hypertrophy (90) + compound (30)
    });

    it('detects Kniebeuge as compound', () => {
      const result = suggestRestTime({ exerciseName: 'Kniebeuge', repsTarget: 5 });
      expect(result.restSeconds).toBe(210); // strength (180) + compound (30)
    });

    it('detects bench press as compound', () => {
      const result = suggestRestTime({ exerciseName: 'Bench Press', repsTarget: 10 });
      expect(result.restSeconds).toBe(120); // hypertrophy + compound
    });

    it('detects deadlift as compound', () => {
      const result = suggestRestTime({ exerciseName: 'Kreuzheben', repsTarget: 3 });
      expect(result.restSeconds).toBe(210); // strength + compound
    });
  });

  describe('isolation exercises', () => {
    it('treats bicep curl as isolation', () => {
      const result = suggestRestTime({ exerciseName: 'Bicep Curl', repsTarget: 12 });
      expect(result.restSeconds).toBe(90); // hypertrophy, no compound bonus
    });

    it('treats lateral raise as isolation', () => {
      const result = suggestRestTime({ exerciseName: 'Seitheben', repsTarget: 15 });
      expect(result.restSeconds).toBe(45); // endurance
    });
  });

  describe('goal-based rest periods', () => {
    it('strength (1-5 reps): 180s base', () => {
      const result = suggestRestTime({ exerciseName: 'Curl', repsTarget: 4 });
      expect(result.restSeconds).toBe(180);
    });

    it('hypertrophy (6-12 reps): 90s base', () => {
      const result = suggestRestTime({ exerciseName: 'Curl', repsTarget: 10 });
      expect(result.restSeconds).toBe(90);
    });

    it('endurance (13+ reps): 45s base', () => {
      const result = suggestRestTime({ exerciseName: 'Curl', repsTarget: 20 });
      expect(result.restSeconds).toBe(45);
    });

    it('allows goal override', () => {
      const result = suggestRestTime({ exerciseName: 'Curl', repsTarget: 10, goal: 'strength' });
      expect(result.restSeconds).toBe(180);
    });
  });

  describe('isometric exercises', () => {
    it('detects plank as isometric', () => {
      const result = suggestRestTime({ exerciseName: 'Plank', durationSeconds: 60 });
      expect(result.restSeconds).toBe(60); // rest = hold time
      expect(result.holdSeconds).toBe(60);
    });

    it('minimum 30s rest for short holds', () => {
      const result = suggestRestTime({ exerciseName: 'Wall Sit', durationSeconds: 20 });
      expect(result.restSeconds).toBe(30);
    });

    it('handles timed exercise flag', () => {
      const result = suggestRestTime({ exerciseName: 'Custom Hold', isTimedExercise: true, durationSeconds: 45 });
      expect(result.restSeconds).toBe(45);
      expect(result.holdSeconds).toBe(45);
    });
  });

  describe('flexibility exercises', () => {
    it('gives short rest for stretching', () => {
      const result = suggestRestTime({ exerciseName: 'Hamstring Stretch' });
      expect(result.restSeconds).toBe(15);
    });

    it('detects yoga as flexibility', () => {
      const result = suggestRestTime({ exerciseName: 'Yoga Flow' });
      expect(result.restSeconds).toBe(15);
    });
  });

  describe('cardio exercises', () => {
    it('gives 60s rest for cardio intervals', () => {
      const result = suggestRestTime({ exerciseName: 'Sprint Intervals' });
      expect(result.restSeconds).toBe(60);
    });

    it('detects Laufen as cardio', () => {
      const result = suggestRestTime({ exerciseName: 'Laufen' });
      expect(result.restSeconds).toBe(60);
      expect(result.warmupMinutes).toBe(10);
    });
  });

  describe('warmup suggestions', () => {
    it('suggests 10 min warmup for compound exercises', () => {
      const result = suggestRestTime({ exerciseName: 'Squat', repsTarget: 8 });
      expect(result.warmupMinutes).toBe(10);
    });

    it('suggests 5 min warmup for isolation exercises', () => {
      const result = suggestRestTime({ exerciseName: 'Curl', repsTarget: 10 });
      expect(result.warmupMinutes).toBe(5);
    });
  });

  describe('reason strings', () => {
    it('provides German reason', () => {
      const result = suggestRestTime({ exerciseName: 'Squat', repsTarget: 8 });
      expect(result.reason).toContain('Muskelaufbau');
      expect(result.reason).toContain('Verbundübung');
    });

    it('provides English reason', () => {
      const result = suggestRestTime({ exerciseName: 'Squat', repsTarget: 8 });
      expect(result.reasonEN).toContain('Hypertrophy');
      expect(result.reasonEN).toContain('compound');
    });
  });
});
