/**
 * useCelebration — Detects and triggers celebration events.
 * Checks for PRs, milestones, streaks, and goal achievements.
 */
import { useState, useCallback, useRef } from 'react';
import type { CelebrationEvent, CelebrationLevel, CelebrationCategory } from '../components/CelebrationOverlay';

// LocalStorage key for tracking shown celebrations (prevent duplicates)
const CELEBRATIONS_SHOWN_KEY = 'fitbuddy_celebrations_shown';
const MAX_STORED = 50;

function getCelebrationsShown(): Set<string> {
  try {
    const stored = localStorage.getItem(CELEBRATIONS_SHOWN_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function markCelebrationShown(id: string): void {
  try {
    const shown = getCelebrationsShown();
    shown.add(id);
    // Keep only last MAX_STORED to prevent unbounded growth
    const arr = Array.from(shown);
    if (arr.length > MAX_STORED) arr.splice(0, arr.length - MAX_STORED);
    localStorage.setItem(CELEBRATIONS_SHOWN_KEY, JSON.stringify(arr));
  } catch {
    // Non-critical
  }
}

function createEvent(
  id: string,
  level: CelebrationLevel,
  category: CelebrationCategory,
  titleDe: string,
  titleEn: string,
  descriptionDe: string,
  descriptionEn: string,
): CelebrationEvent {
  return { id, level, category, titleDe, titleEn, descriptionDe, descriptionEn };
}

export function useCelebration() {
  const [currentEvent, setCurrentEvent] = useState<CelebrationEvent | null>(null);
  const queue = useRef<CelebrationEvent[]>([]);
  const isShowing = useRef(false);

  const showNext = useCallback(() => {
    if (queue.current.length === 0) {
      isShowing.current = false;
      return;
    }
    const next = queue.current.shift()!;
    setCurrentEvent(next);
    isShowing.current = true;
  }, []);

  const dismiss = useCallback(() => {
    setCurrentEvent(null);
    // Show next queued event after small delay
    setTimeout(showNext, 500);
  }, [showNext]);

  const celebrate = useCallback((event: CelebrationEvent) => {
    const shown = getCelebrationsShown();
    if (shown.has(event.id)) return; // Already shown

    markCelebrationShown(event.id);

    if (isShowing.current) {
      queue.current.push(event);
    } else {
      setCurrentEvent(event);
      isShowing.current = true;
    }
  }, []);

  // ── Specific celebration triggers ─────────────────────────

  const celebrateNewPR = useCallback((exerciseName: string, newWeight: number, oldWeight: number) => {
    const delta = (newWeight - oldWeight).toFixed(1);
    const today = new Date().toISOString().split('T')[0];
    celebrate(createEvent(
      `pr_${exerciseName}_${today}`,
      'big',
      'training',
      '🏆 Neuer PR!',
      '🏆 New PR!',
      `${exerciseName}: +${delta}kg (${newWeight}kg)`,
      `${exerciseName}: +${delta}kg (${newWeight}kg)`,
    ));
  }, [celebrate]);

  const celebrateStreak = useCallback((days: number) => {
    const level: CelebrationLevel = days >= 30 ? 'mega' : days >= 7 ? 'big' : 'medium';
    const month = new Date().toISOString().slice(0, 7);
    celebrate(createEvent(
      `streak_${days}_${month}`,
      level,
      'streak',
      `🔥 ${days}-Tage-Streak!`,
      `🔥 ${days}-Day Streak!`,
      days >= 30 ? 'Unglaublich! Du bist absolut am Ball!' : days >= 7 ? 'Eine ganze Woche! Starke Leistung!' : 'Weiter so — Konsistenz zahlt sich aus!',
      days >= 30 ? 'Incredible! You are crushing it!' : days >= 7 ? 'A full week! Strong performance!' : 'Keep going — consistency pays off!',
    ));
  }, [celebrate]);

  const celebrateWeightMilestone = useCallback((kgLost: number) => {
    const level: CelebrationLevel = kgLost >= 10 ? 'mega' : kgLost >= 5 ? 'big' : 'medium';
    celebrate(createEvent(
      `weight_milestone_${kgLost}kg`,
      level,
      'body',
      `📉 ${kgLost}kg geschafft!`,
      `📉 ${kgLost}kg lost!`,
      kgLost >= 10 ? 'Was fuer eine Transformation! Absolut beeindruckend!' : kgLost >= 5 ? 'Halbzeit-Meilenstein! Du schaffst das!' : 'Erster Meilenstein! Der Anfang ist gemacht!',
      kgLost >= 10 ? 'What a transformation! Absolutely impressive!' : kgLost >= 5 ? 'Halfway milestone! You got this!' : 'First milestone! The journey has begun!',
    ));
  }, [celebrate]);

  const celebrateCalorieGoal = useCallback((daysInRow: number) => {
    const today = new Date().toISOString().split('T')[0];
    celebrate(createEvent(
      `calorie_goal_${daysInRow}_${today}`,
      daysInRow >= 7 ? 'big' : 'small',
      'nutrition',
      daysInRow >= 7 ? '🎯 Kaloriendefizit-Serie!' : '🎯 Ziel erreicht!',
      daysInRow >= 7 ? '🎯 Calorie Streak!' : '🎯 Goal reached!',
      `${daysInRow} Tag${daysInRow > 1 ? 'e' : ''} im Defizit — starke Disziplin!`,
      `${daysInRow} day${daysInRow > 1 ? 's' : ''} in deficit — strong discipline!`,
    ));
  }, [celebrate]);

  const celebrateProteinGoal = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    celebrate(createEvent(
      `protein_goal_${today}`,
      'small',
      'nutrition',
      '💪 Proteinziel erreicht!',
      '💪 Protein goal hit!',
      'Perfekte Proteinversorgung heute!',
      'Perfect protein intake today!',
    ));
  }, [celebrate]);

  const celebrateFirstWorkoutOfWeek = useCallback(() => {
    const weekNum = getISOWeekNumber(new Date());
    celebrate(createEvent(
      `first_workout_week_${weekNum}`,
      'small',
      'training',
      '💪 Los geht\'s!',
      '💪 Let\'s go!',
      'Erstes Training der Woche — guter Start!',
      'First workout of the week — great start!',
    ));
  }, [celebrate]);

  const celebrateBPImprovement = useCallback((oldSys: number, newSys: number) => {
    celebrate(createEvent(
      `bp_improvement_${new Date().toISOString().split('T')[0]}`,
      'medium',
      'health',
      '❤️ Blutdruck verbessert!',
      '❤️ Blood pressure improved!',
      `Systolisch ${oldSys} → ${newSys} mmHg — Trend stimmt!`,
      `Systolic ${oldSys} → ${newSys} mmHg — trending right!`,
    ));
  }, [celebrate]);

  return {
    currentEvent,
    dismiss,
    celebrate,
    celebrateNewPR,
    celebrateStreak,
    celebrateWeightMilestone,
    celebrateCalorieGoal,
    celebrateProteinGoal,
    celebrateFirstWorkoutOfWeek,
    celebrateBPImprovement,
  };
}

function getISOWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}
