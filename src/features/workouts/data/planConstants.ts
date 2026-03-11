/**
 * planConstants — Shared constants and helpers for training plan creation/editing.
 *
 * Extracted from CreatePlanDialog so both PlanWizard and legacy dialogs can use them.
 */

import type { SplitType } from '../../../types/health';

export const SPLIT_OPTIONS: { value: SplitType; labelDE: string; labelEN: string }[] = [
  { value: 'ppl', labelDE: 'Push/Pull/Legs', labelEN: 'Push/Pull/Legs' },
  { value: 'upper_lower', labelDE: 'Upper/Lower', labelEN: 'Upper/Lower' },
  { value: 'full_body', labelDE: 'Ganzkörper', labelEN: 'Full Body' },
  { value: 'custom', labelDE: 'Custom', labelEN: 'Custom' },
  { value: 'running', labelDE: 'Laufplan', labelEN: 'Running Plan' },
  { value: 'swimming', labelDE: 'Schwimmplan', labelEN: 'Swimming Plan' },
  { value: 'cycling', labelDE: 'Radfahrplan', labelEN: 'Cycling Plan' },
  { value: 'yoga', labelDE: 'Yoga', labelEN: 'Yoga' },
  { value: 'martial_arts', labelDE: 'Kampfsport', labelEN: 'Martial Arts' },
  { value: 'mixed', labelDE: 'Gemischt', labelEN: 'Mixed' },
];

export const DAYS_OPTIONS = [2, 3, 4, 5, 6, 7];

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
    default:
      return Array.from({ length: daysPerWeek }, (_, i) => `${day} ${i + 1}`);
  }
}
