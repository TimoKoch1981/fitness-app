/**
 * Types for training phase cycles (automated phase sequencing).
 * A cycle defines an ordered list of phases with durations that auto-advance.
 */

import type { TrainingPhase } from '../../../types/health';

/** A single phase within a cycle */
export interface CyclePhaseEntry {
  phase: TrainingPhase;
  weeks: number; // 0 = indefinite (pause auto-advance)
}

/** A training phase cycle (DB row) */
export interface TrainingPhaseCycle {
  id: string;
  user_id: string;
  name: string;
  phases: CyclePhaseEntry[];
  auto_repeat: boolean;
  is_active: boolean;
  current_phase_index: number;
  template_name: string | null;
  created_at: string;
  updated_at: string;
}

/** Standard cycle templates */
export interface CycleTemplate {
  name: string;
  de: string;
  en: string;
  description_de: string;
  description_en: string;
  icon: string;
  phases: CyclePhaseEntry[];
  auto_repeat: boolean;
}

/** The 3 standard templates */
export const CYCLE_TEMPLATES: CycleTemplate[] = [
  {
    name: 'classic_bb',
    de: 'Klassischer Bodybuilding-Zyklus',
    en: 'Classic Bodybuilding Cycle',
    description_de: 'Aufbau → Definition → Erhaltung. Der bewährte Dreierphasen-Zyklus.',
    description_en: 'Bulk → Cut → Maintenance. The proven three-phase cycle.',
    icon: '🏆',
    phases: [
      { phase: 'bulk', weeks: 16 },
      { phase: 'cut', weeks: 12 },
      { phase: 'maintenance', weeks: 8 },
    ],
    auto_repeat: true,
  },
  {
    name: 'recomp',
    de: 'Rekomposition',
    en: 'Recomposition',
    description_de: 'Kurze Aufbau- und Definitionsphasen im Wechsel für stetige Fortschritte.',
    description_en: 'Short alternating bulk and cut phases for steady progress.',
    icon: '🔄',
    phases: [
      { phase: 'bulk', weeks: 8 },
      { phase: 'cut', weeks: 6 },
      { phase: 'maintenance', weeks: 4 },
    ],
    auto_repeat: true,
  },
  {
    name: 'contest_prep',
    de: 'Wettkampfvorbereitung',
    en: 'Contest Prep',
    description_de: 'Lange Aufbauphase → aggressive Definition → Reverse Diet → Peak Week.',
    description_en: 'Long bulk → aggressive cut → reverse diet → peak week.',
    icon: '🎯',
    phases: [
      { phase: 'bulk', weeks: 20 },
      { phase: 'cut', weeks: 16 },
      { phase: 'reverse_diet', weeks: 6 },
      { phase: 'peak_week', weeks: 1 },
      { phase: 'off_season', weeks: 8 },
    ],
    auto_repeat: false,
  },
];
