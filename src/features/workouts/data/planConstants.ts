/**
 * planConstants — Shared constants and helpers for training plan creation/editing.
 *
 * Extracted from CreatePlanDialog so both PlanWizard and legacy dialogs can use them.
 */

import type { DayType, SplitType } from '../../../types/health';

/** Training type groups for the first step of plan creation */
export const TRAINING_TYPE_GROUPS: { type: SplitType[]; labelDE: string; labelEN: string; icon: string }[] = [
  { type: ['ppl', 'upper_lower', 'full_body', 'custom'], labelDE: 'Krafttraining', labelEN: 'Strength Training', icon: '💪' },
  { type: ['yoga'], labelDE: 'Yoga', labelEN: 'Yoga', icon: '🧘' },
  { type: ['tai_chi'], labelDE: 'Tai Chi', labelEN: 'Tai Chi', icon: '🥋' },
  { type: ['five_tibetans'], labelDE: 'Five Tibetans', labelEN: 'Five Tibetans', icon: '🌀' },
  { type: ['running', 'swimming', 'cycling'], labelDE: 'Ausdauer', labelEN: 'Endurance', icon: '🏃' },
  { type: ['mixed'], labelDE: 'Kombi-Plan', labelEN: 'Combo Plan', icon: '🔄' },
];

export const SPLIT_OPTIONS: { value: SplitType; labelDE: string; labelEN: string }[] = [
  // Strength
  { value: 'ppl', labelDE: 'Push/Pull/Legs', labelEN: 'Push/Pull/Legs' },
  { value: 'upper_lower', labelDE: 'Upper/Lower', labelEN: 'Upper/Lower' },
  { value: 'full_body', labelDE: 'Ganzkörper', labelEN: 'Full Body' },
  { value: 'custom', labelDE: 'Custom', labelEN: 'Custom' },
  // Endurance
  { value: 'running', labelDE: 'Laufplan', labelEN: 'Running Plan' },
  { value: 'swimming', labelDE: 'Schwimmplan', labelEN: 'Swimming Plan' },
  { value: 'cycling', labelDE: 'Radfahrplan', labelEN: 'Cycling Plan' },
  // Mind-Body
  { value: 'yoga', labelDE: 'Yoga', labelEN: 'Yoga' },
  { value: 'tai_chi', labelDE: 'Tai Chi', labelEN: 'Tai Chi' },
  { value: 'five_tibetans', labelDE: 'Five Tibetans', labelEN: 'Five Tibetans' },
  // Other
  { value: 'martial_arts', labelDE: 'Kampfsport', labelEN: 'Martial Arts' },
  { value: 'mixed', labelDE: 'Kombi-Plan', labelEN: 'Combo Plan' },
];

export const DAYS_OPTIONS = [2, 3, 4, 5, 6, 7];

/** Day type options for combo/mixed plans */
export const DAY_TYPE_OPTIONS: { value: DayType; labelDE: string; labelEN: string; icon: string }[] = [
  { value: 'strength', labelDE: 'Krafttraining', labelEN: 'Strength', icon: '💪' },
  { value: 'yoga', labelDE: 'Yoga', labelEN: 'Yoga', icon: '🧘' },
  { value: 'tai_chi', labelDE: 'Tai Chi', labelEN: 'Tai Chi', icon: '🥋' },
  { value: 'five_tibetans', labelDE: 'Five Tibetans', labelEN: 'Five Tibetans', icon: '🌀' },
  { value: 'cardio', labelDE: 'Cardio', labelEN: 'Cardio', icon: '🏃' },
  { value: 'mixed', labelDE: 'Gemischt', labelEN: 'Mixed', icon: '🔀' },
];

/** Default day name patterns based on split type */
export function getDefaultDayNames(splitType: SplitType, daysPerWeek: number, isDE: boolean): string[] {
  const day = isDE ? 'Tag' : 'Day';

  switch (splitType) {
    case 'ppl': {
      const cycle = ['Push', 'Pull', 'Legs'];
      return Array.from({ length: daysPerWeek }, (_, i) => cycle[i % 3]);
    }
    case 'upper_lower': {
      const cycle = isDE
        ? ['Oberkörper', 'Unterkörper']
        : ['Upper Body', 'Lower Body'];
      return Array.from({ length: daysPerWeek }, (_, i) => {
        const base = cycle[i % 2];
        const letter = String.fromCharCode(65 + Math.floor(i / 2));
        return `${base} ${letter}`;
      });
    }
    case 'full_body':
      return Array.from({ length: daysPerWeek }, (_, i) =>
        `${isDE ? 'Ganzkörper' : 'Full Body'} ${String.fromCharCode(65 + i)}`
      );
    case 'yoga':
      return Array.from({ length: daysPerWeek }, (_, i) =>
        `Yoga ${String.fromCharCode(65 + i)}`
      );
    case 'tai_chi':
      return Array.from({ length: daysPerWeek }, (_, i) =>
        `Tai Chi ${String.fromCharCode(65 + i)}`
      );
    case 'five_tibetans':
      return Array.from({ length: daysPerWeek }, (_, i) => {
        const weekdays = isDE
          ? ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
          : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return weekdays[i % 7];
      });
    case 'mixed':
      return Array.from({ length: daysPerWeek }, (_, i) => `${day} ${i + 1}`);
    default:
      return Array.from({ length: daysPerWeek }, (_, i) => `${day} ${i + 1}`);
  }
}

/** Get default day_type for a split type */
export function getDefaultDayType(splitType: SplitType): DayType | undefined {
  switch (splitType) {
    case 'ppl':
    case 'upper_lower':
    case 'full_body':
    case 'custom':
      return 'strength';
    case 'yoga':
      return 'yoga';
    case 'tai_chi':
      return 'tai_chi';
    case 'five_tibetans':
      return 'five_tibetans';
    case 'running':
    case 'swimming':
    case 'cycling':
      return 'cardio';
    case 'mixed':
      return undefined; // User chooses per day
    default:
      return undefined;
  }
}
