/**
 * Tests for parseWorkoutCommand — Voice command parsing for workouts.
 */

import { describe, it, expect } from 'vitest';
import { parseWorkoutCommand } from '../useWorkoutVoiceCommands';

describe('parseWorkoutCommand', () => {
  describe('next exercise', () => {
    it('recognizes "nächste Übung"', () => {
      expect(parseWorkoutCommand('nächste Übung')).toEqual({ type: 'next_exercise' });
    });

    it('recognizes "nachste Übung" (without umlaut)', () => {
      expect(parseWorkoutCommand('nachste Übung')).toEqual({ type: 'next_exercise' });
    });

    it('recognizes "next"', () => {
      expect(parseWorkoutCommand('next')).toEqual({ type: 'next_exercise' });
    });

    it('recognizes "weiter"', () => {
      expect(parseWorkoutCommand('weiter')).toEqual({ type: 'next_exercise' });
    });

    it('recognizes "nächste exercise"', () => {
      expect(parseWorkoutCommand('nächste exercise')).toEqual({ type: 'next_exercise' });
    });
  });

  describe('previous exercise', () => {
    it('recognizes "zurück"', () => {
      expect(parseWorkoutCommand('zurück')).toEqual({ type: 'prev_exercise' });
    });

    it('recognizes "zuruck" (without umlaut)', () => {
      expect(parseWorkoutCommand('zuruck')).toEqual({ type: 'prev_exercise' });
    });

    it('recognizes "back"', () => {
      expect(parseWorkoutCommand('back')).toEqual({ type: 'prev_exercise' });
    });

    it('recognizes "previous"', () => {
      expect(parseWorkoutCommand('previous')).toEqual({ type: 'prev_exercise' });
    });

    it('recognizes "vorherige Übung"', () => {
      expect(parseWorkoutCommand('vorherige Übung')).toEqual({ type: 'prev_exercise' });
    });
  });

  describe('skip exercise', () => {
    it('recognizes "überspringen"', () => {
      expect(parseWorkoutCommand('überspringen')).toEqual({ type: 'skip_exercise' });
    });

    it('recognizes "skip"', () => {
      expect(parseWorkoutCommand('skip')).toEqual({ type: 'skip_exercise' });
    });
  });

  describe('log set', () => {
    it('recognizes "10 Wiederholungen"', () => {
      expect(parseWorkoutCommand('10 Wiederholungen')).toEqual({
        type: 'log_set',
        reps: 10,
        weightKg: undefined,
      });
    });

    it('recognizes "8 reps"', () => {
      expect(parseWorkoutCommand('8 reps')).toEqual({
        type: 'log_set',
        reps: 8,
        weightKg: undefined,
      });
    });

    it('recognizes "10 Wiederholungen mit 80 Kilo"', () => {
      expect(parseWorkoutCommand('10 Wiederholungen mit 80 Kilo')).toEqual({
        type: 'log_set',
        reps: 10,
        weightKg: 80,
      });
    });

    it('recognizes "12 reps at 60.5 kg"', () => {
      expect(parseWorkoutCommand('12 reps at 60.5 kg')).toEqual({
        type: 'log_set',
        reps: 12,
        weightKg: 60.5,
      });
    });

    it('recognizes "5 Wdh bei 100 kg"', () => {
      expect(parseWorkoutCommand('5 Wdh bei 100 kg')).toEqual({
        type: 'log_set',
        reps: 5,
        weightKg: 100,
      });
    });

    it('recognizes reversed order "80 kilo 10 reps"', () => {
      expect(parseWorkoutCommand('80 kilo 10 reps')).toEqual({
        type: 'log_set',
        reps: 10,
        weightKg: 80,
      });
    });

    it('handles comma decimal "82,5 kg 8 Wiederholungen"', () => {
      expect(parseWorkoutCommand('82,5 kg 8 Wiederholungen')).toEqual({
        type: 'log_set',
        reps: 8,
        weightKg: 82.5,
      });
    });
  });

  describe('timer commands', () => {
    it('recognizes "Timer starten"', () => {
      expect(parseWorkoutCommand('Timer starten')).toEqual({ type: 'start_timer' });
    });

    it('recognizes "start timer"', () => {
      expect(parseWorkoutCommand('start timer')).toEqual({ type: 'start_timer' });
    });

    it('recognizes "starte den Timer"', () => {
      expect(parseWorkoutCommand('starte den Timer')).toEqual({ type: 'start_timer' });
    });

    it('recognizes "Timer stoppen"', () => {
      expect(parseWorkoutCommand('Timer stoppen')).toEqual({ type: 'stop_timer' });
    });

    it('recognizes "stop timer"', () => {
      expect(parseWorkoutCommand('stop timer')).toEqual({ type: 'stop_timer' });
    });
  });

  describe('finish session', () => {
    it('recognizes "Training beenden"', () => {
      expect(parseWorkoutCommand('Training beenden')).toEqual({ type: 'finish_session' });
    });

    it('recognizes "fertig"', () => {
      expect(parseWorkoutCommand('fertig')).toEqual({ type: 'finish_session' });
    });

    it('recognizes "finish workout"', () => {
      expect(parseWorkoutCommand('finish workout')).toEqual({ type: 'finish_session' });
    });

    it('recognizes "done"', () => {
      expect(parseWorkoutCommand('done')).toEqual({ type: 'finish_session' });
    });

    it('recognizes "abschließen"', () => {
      expect(parseWorkoutCommand('abschließen')).toEqual({ type: 'finish_session' });
    });
  });

  describe('rest phase', () => {
    it('recognizes "pause"', () => {
      expect(parseWorkoutCommand('pause')).toEqual({ type: 'rest_phase' });
    });

    it('recognizes "rest"', () => {
      expect(parseWorkoutCommand('rest')).toEqual({ type: 'rest_phase' });
    });
  });

  describe('unknown commands', () => {
    it('returns unknown for empty string', () => {
      expect(parseWorkoutCommand('')).toEqual({ type: 'unknown', transcript: '' });
    });

    it('returns unknown for unrecognized text', () => {
      expect(parseWorkoutCommand('Wie wird das Wetter morgen?')).toEqual({
        type: 'unknown',
        transcript: 'Wie wird das Wetter morgen?',
      });
    });
  });

  describe('case insensitivity', () => {
    it('handles uppercase "NEXT"', () => {
      expect(parseWorkoutCommand('NEXT')).toEqual({ type: 'next_exercise' });
    });

    it('handles mixed case "Timer Starten"', () => {
      expect(parseWorkoutCommand('Timer Starten')).toEqual({ type: 'start_timer' });
    });
  });
});
