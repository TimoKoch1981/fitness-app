/**
 * Standardized muscle identifier → human-readable name mapping.
 * DB stores EN identifiers (e.g. 'lats'), frontend translates via this map.
 *
 * Used by ExercisePicker, ExerciseDetail, Plan-Editor for display.
 */

import type { MuscleIdentifier, BodyRegion, MovementPattern } from '../../../types/health';

// ── Muscle Names ────────────────────────────────────────────────────────

export const muscleNames: Record<MuscleIdentifier, { de: string; en: string }> = {
  chest: { de: 'Brust', en: 'Chest' },
  upper_chest: { de: 'Obere Brust', en: 'Upper Chest' },
  lats: { de: 'Latissimus', en: 'Lats' },
  rhomboids: { de: 'Rhomboiden', en: 'Rhomboids' },
  traps: { de: 'Trapezius', en: 'Traps' },
  erector_spinae: { de: 'Rückenstrecker', en: 'Erector Spinae' },
  front_delts: { de: 'Vordere Schulter', en: 'Front Delts' },
  lateral_delts: { de: 'Seitliche Schulter', en: 'Lateral Delts' },
  rear_delts: { de: 'Hintere Schulter', en: 'Rear Delts' },
  biceps: { de: 'Bizeps', en: 'Biceps' },
  triceps: { de: 'Trizeps', en: 'Triceps' },
  forearms: { de: 'Unterarme', en: 'Forearms' },
  quads: { de: 'Quadrizeps', en: 'Quads' },
  hamstrings: { de: 'Hamstrings', en: 'Hamstrings' },
  glutes: { de: 'Gluteus', en: 'Glutes' },
  adductors: { de: 'Adduktoren', en: 'Adductors' },
  abductors: { de: 'Abduktoren', en: 'Abductors' },
  hip_flexors: { de: 'Hüftbeuger', en: 'Hip Flexors' },
  calves: { de: 'Waden', en: 'Calves' },
  abs: { de: 'Bauch', en: 'Abs' },
  obliques: { de: 'Schräger Bauch', en: 'Obliques' },
  deep_core: { de: 'Core (tief)', en: 'Deep Core' },
  cardiovascular: { de: 'Herz-Kreislauf', en: 'Cardiovascular' },
};

// ── Body Region Names ───────────────────────────────────────────────────

export const bodyRegionNames: Record<BodyRegion, { de: string; en: string }> = {
  chest: { de: 'Brust', en: 'Chest' },
  back: { de: 'Rücken', en: 'Back' },
  shoulders: { de: 'Schultern', en: 'Shoulders' },
  arms: { de: 'Arme', en: 'Arms' },
  legs: { de: 'Beine', en: 'Legs' },
  core: { de: 'Core', en: 'Core' },
  full_body: { de: 'Ganzkörper', en: 'Full Body' },
  cardio: { de: 'Cardio', en: 'Cardio' },
  mind_body: { de: 'Mind & Body', en: 'Mind & Body' },
};

// ── Pose Category Names (for Yoga / Mind-Body filter chips) ─────────

import type { PoseCategory } from '../../../types/health';

export const poseCategoryNames: Record<PoseCategory, { de: string; en: string; icon: string }> = {
  standing: { de: 'Stehend', en: 'Standing', icon: '🧍' },
  seated: { de: 'Sitzend', en: 'Seated', icon: '🪷' },
  forward_fold: { de: 'Vorbeuge', en: 'Forward Fold', icon: '🙇' },
  backbend: { de: 'Rückbeuge', en: 'Backbend', icon: '🌙' },
  twist: { de: 'Drehung', en: 'Twist', icon: '🔄' },
  inversion: { de: 'Umkehr', en: 'Inversion', icon: '🙃' },
  balance: { de: 'Balance', en: 'Balance', icon: '⚖️' },
  core: { de: 'Core', en: 'Core', icon: '🎯' },
  flow: { de: 'Flow', en: 'Flow', icon: '🌊' },
  restorative: { de: 'Regenerativ', en: 'Restorative', icon: '😌' },
  tai_chi_form: { de: 'Form', en: 'Form', icon: '🥋' },
  tai_chi_qigong: { de: 'Qigong', en: 'Qigong', icon: '🌬️' },
  tibetan_rite: { de: 'Tibeter', en: 'Tibetan Rite', icon: '🌀' },
};

/**
 * Get localized pose category name.
 */
export function getPoseCategoryName(category: string, lang: 'de' | 'en' = 'de'): string {
  const entry = poseCategoryNames[category as PoseCategory];
  return entry ? entry[lang] : category;
}

/**
 * Get pose category icon.
 */
export function getPoseCategoryIcon(category: string): string {
  const entry = poseCategoryNames[category as PoseCategory];
  return entry?.icon ?? '🏋️';
}

// ── Movement Pattern Names ──────────────────────────────────────────────

export const movementPatternNames: Record<MovementPattern, { de: string; en: string }> = {
  horizontal_push: { de: 'Horizontales Drücken', en: 'Horizontal Push' },
  horizontal_pull: { de: 'Horizontales Ziehen', en: 'Horizontal Pull' },
  vertical_push: { de: 'Vertikales Drücken', en: 'Vertical Push' },
  vertical_pull: { de: 'Vertikales Ziehen', en: 'Vertical Pull' },
  hip_hinge: { de: 'Hüftbeuge', en: 'Hip Hinge' },
  squat: { de: 'Kniebeuge', en: 'Squat' },
  lunge: { de: 'Ausfallschritt', en: 'Lunge' },
  carry: { de: 'Tragen', en: 'Carry' },
  rotation: { de: 'Rotation', en: 'Rotation' },
  anti_rotation: { de: 'Anti-Rotation', en: 'Anti-Rotation' },
  isolation: { de: 'Isolation', en: 'Isolation' },
  cardio_steady: { de: 'Cardio (stetig)', en: 'Steady-State Cardio' },
  cardio_interval: { de: 'Cardio (Intervall)', en: 'Interval Cardio' },
  flexibility: { de: 'Flexibilität', en: 'Flexibility' },
  plyometric: { de: 'Plyometrie', en: 'Plyometric' },
  yoga_static: { de: 'Yoga (statisch)', en: 'Yoga (Static)' },
  yoga_flow: { de: 'Yoga (Flow)', en: 'Yoga (Flow)' },
  tai_chi_form: { de: 'Tai Chi Form', en: 'Tai Chi Form' },
  mind_body_dynamic: { de: 'Mind-Body (dynamisch)', en: 'Mind-Body (Dynamic)' },
  other: { de: 'Sonstige', en: 'Other' },
};

// ── Helper Functions ────────────────────────────────────────────────────

/**
 * Get localized muscle name by identifier.
 * Falls back to the raw identifier if not found.
 */
export function getMuscleName(id: string, lang: 'de' | 'en' = 'de'): string {
  const entry = muscleNames[id as MuscleIdentifier];
  return entry ? entry[lang] : id;
}

/**
 * Get localized body region name.
 */
export function getBodyRegionName(region: string, lang: 'de' | 'en' = 'de'): string {
  const entry = bodyRegionNames[region as BodyRegion];
  return entry ? entry[lang] : region;
}

/**
 * Get localized movement pattern name.
 */
export function getMovementPatternName(pattern: string, lang: 'de' | 'en' = 'de'): string {
  const entry = movementPatternNames[pattern as MovementPattern];
  return entry ? entry[lang] : pattern;
}

/**
 * Get all muscle names as array of { id, de, en } for filter dropdowns.
 */
export function getMuscleList() {
  return Object.entries(muscleNames).map(([id, names]) => ({
    id: id as MuscleIdentifier,
    ...names,
  }));
}

/**
 * Get all body regions as array for filter chips.
 */
export function getBodyRegionList() {
  return Object.entries(bodyRegionNames).map(([id, names]) => ({
    id: id as BodyRegion,
    ...names,
  }));
}
