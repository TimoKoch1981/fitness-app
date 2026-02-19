/**
 * Dynamic User Skills Generator.
 *
 * Generates personalized context documents from the user's live data.
 * These "user skills" are Markdown-formatted knowledge blocks that get
 * injected into agent system prompts — giving the LLM up-to-date,
 * personalized context WITHOUT sending raw database dumps.
 *
 * Each skill focuses on one aspect of the user's health data.
 * Agents request ONLY the skills they need.
 *
 * @version 1.0.0
 */

import type { UserSkillsMeta } from './types';
import type {
  UserProfile,
  DailyStats,
  BodyMeasurement,
  Substance,
  Workout,
  Meal,
  BloodPressure,
  SubstanceLog,
  TrainingGoal,
  TrainingPlan,
  ProductNutrition,
  UserProduct,
} from '../../../types/health';

// ── Generator Metadata ─────────────────────────────────────────────────

export const USER_SKILLS_META: UserSkillsMeta = {
  id: 'user_skills',
  version: '1.0.0',
  updatedAt: '2026-02-17',
  generatorVersion: '1.0.0',
  changelog: [
    {
      version: '1.0.0',
      date: '2026-02-17',
      changes: 'Initial: profile, nutrition_log, training_log, body_progress, substance_protocol, daily_summary generators',
    },
  ],
};

// ── Types ──────────────────────────────────────────────────────────────

export interface UserSkillData {
  profile?: UserProfile;
  dailyStats?: DailyStats;
  recentMeals?: Meal[];
  recentWorkouts?: Workout[];
  latestBody?: BodyMeasurement;
  bodyHistory?: BodyMeasurement[];
  activeSubstances?: Substance[];
  recentSubstanceLogs?: SubstanceLog[];
  recentBloodPressure?: BloodPressure[];
  trainingGoals?: TrainingGoal[];
  activePlan?: TrainingPlan;
  userProducts?: UserProduct[];
  standardProducts?: ProductNutrition[];
}

export type UserSkillType =
  | 'profile'
  | 'nutrition_log'
  | 'training_log'
  | 'body_progress'
  | 'substance_protocol'
  | 'daily_summary'
  | 'active_plan'
  | 'known_products';

// ── Profile Skill ──────────────────────────────────────────────────────

/**
 * Generates the user profile skill — basic identity & goals.
 */
export function generateProfileSkill(data: UserSkillData): string {
  const { profile, latestBody } = data;
  if (!profile) return '';

  const age = profile.birth_date
    ? calculateAge(profile.birth_date)
    : null;

  let skill = `## NUTZERPROFIL\n`;
  skill += `- Name: ${profile.display_name ?? 'Nutzer'}\n`;
  if (profile.height_cm) skill += `- Größe: ${profile.height_cm} cm\n`;
  if (age) skill += `- Alter: ${age} Jahre\n`;
  if (profile.gender) skill += `- Geschlecht: ${profile.gender === 'male' ? 'männlich' : profile.gender === 'female' ? 'weiblich' : 'divers'}\n`;
  if (latestBody?.weight_kg) skill += `- Aktuelles Gewicht: ${latestBody.weight_kg} kg\n`;
  if (latestBody?.body_fat_pct) skill += `- Körperfettanteil: ${latestBody.body_fat_pct}%\n`;
  if (latestBody?.muscle_mass_kg) skill += `- Muskelmasse: ${latestBody.muscle_mass_kg} kg\n`;

  skill += `\n### Tagesziele\n`;
  skill += `- Kalorien: ${profile.daily_calories_goal} kcal\n`;
  skill += `- Protein: ${profile.daily_protein_goal} g\n`;
  skill += `- Wasser: ${profile.daily_water_goal} Gläser\n`;
  skill += `- Aktivitätslevel (PAL): ${profile.activity_level}\n`;

  if (latestBody?.weight_kg && profile.height_cm) {
    const bmi = latestBody.weight_kg / ((profile.height_cm / 100) ** 2);
    skill += `\n### Berechnete Werte\n`;
    skill += `- BMI: ${bmi.toFixed(1)}\n`;
    if (latestBody.body_fat_pct) {
      const leanMass = latestBody.weight_kg * (1 - latestBody.body_fat_pct / 100);
      skill += `- Magermasse: ${leanMass.toFixed(1)} kg\n`;
      skill += `- FFMI: ${(leanMass / ((profile.height_cm / 100) ** 2)).toFixed(1)}\n`;
    }
  }

  return skill;
}

// ── Nutrition Log Skill ────────────────────────────────────────────────

/**
 * Generates today's nutrition summary + recent eating patterns.
 */
export function generateNutritionLogSkill(data: UserSkillData): string {
  const { dailyStats, recentMeals } = data;

  let skill = `## ERNÄHRUNG HEUTE\n`;

  if (dailyStats) {
    const calRemaining = (dailyStats.caloriesGoal ?? 2000) - dailyStats.calories;
    const protRemaining = (dailyStats.proteinGoal ?? 150) - dailyStats.protein;

    skill += `- Kalorien: ${dailyStats.calories} / ${dailyStats.caloriesGoal} kcal`;
    skill += calRemaining > 0 ? ` (noch ${calRemaining} kcal übrig)\n` : ` (${Math.abs(calRemaining)} kcal ÜBER Ziel)\n`;
    skill += `- Protein: ${dailyStats.protein} / ${dailyStats.proteinGoal} g`;
    skill += protRemaining > 0 ? ` (noch ${protRemaining} g übrig)\n` : ` (${Math.abs(protRemaining)} g ÜBER Ziel)\n`;
    skill += `- Kohlenhydrate: ${dailyStats.carbs} g\n`;
    skill += `- Fett: ${dailyStats.fat} g\n`;
    skill += `- Wasser: ${dailyStats.water} / ${dailyStats.waterGoal} Gläser\n`;
  }

  if (recentMeals && recentMeals.length > 0) {
    skill += `\n### Heutige Mahlzeiten\n`;
    recentMeals.slice(0, 10).forEach((meal) => {
      skill += `- ${mealTypeDE(meal.type)}: ${meal.name} (${meal.calories} kcal, ${meal.protein}g P, ${meal.carbs}g C, ${meal.fat}g F)\n`;
    });
  } else {
    skill += `\n> Heute noch keine Mahlzeiten geloggt.\n`;
  }

  // Calculate macro distribution
  if (dailyStats && dailyStats.calories > 0) {
    const pCal = dailyStats.protein * 4;
    const cCal = dailyStats.carbs * 4;
    const fCal = dailyStats.fat * 9;
    const total = pCal + cCal + fCal;
    if (total > 0) {
      skill += `\n### Makro-Verteilung heute\n`;
      skill += `- Protein: ${Math.round(pCal / total * 100)}%\n`;
      skill += `- Carbs: ${Math.round(cCal / total * 100)}%\n`;
      skill += `- Fett: ${Math.round(fCal / total * 100)}%\n`;
    }
  }

  return skill;
}

// ── Training Log Skill ─────────────────────────────────────────────────

/**
 * Generates training history and current training status.
 */
export function generateTrainingLogSkill(data: UserSkillData): string {
  const { recentWorkouts, trainingGoals } = data;

  let skill = `## TRAININGSHISTORIE\n`;

  if (recentWorkouts && recentWorkouts.length > 0) {
    skill += `\n### Letzte Trainings (neueste zuerst)\n`;
    recentWorkouts.slice(0, 10).forEach((w) => {
      skill += `- ${w.date}: ${w.name} (${workoutTypeDE(w.type)}`;
      if (w.duration_minutes) skill += `, ${w.duration_minutes} Min`;
      if (w.calories_burned) skill += `, ~${w.calories_burned} kcal verbrannt`;
      skill += `)\n`;
      if (w.exercises && w.exercises.length > 0) {
        w.exercises.slice(0, 5).forEach((ex) => {
          skill += `  • ${ex.name}`;
          if (ex.sets && ex.reps) skill += `: ${ex.sets}×${ex.reps}`;
          if (ex.weight_kg) skill += ` @ ${ex.weight_kg}kg`;
          skill += `\n`;
        });
      }
    });

    // Days since last workout
    const lastDate = new Date(recentWorkouts[0].date);
    const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    skill += `\n> Letztes Training vor ${daysSince} Tag(en).\n`;

    // Weekly frequency
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeek = recentWorkouts.filter(w => new Date(w.date) >= oneWeekAgo);
    skill += `> Diese Woche: ${thisWeek.length} Training(s)\n`;
  } else {
    skill += `> Keine Trainings in der Historie.\n`;
  }

  if (trainingGoals && trainingGoals.length > 0) {
    skill += `\n### Aktive Trainingsziele\n`;
    trainingGoals.filter(g => !g.is_completed).forEach((g) => {
      skill += `- ${g.title}`;
      if (g.current_value != null && g.target_value != null) {
        skill += `: ${g.current_value}/${g.target_value} ${g.unit ?? ''}`;
      }
      if (g.target_date) skill += ` (Ziel: ${g.target_date})`;
      skill += `\n`;
    });
  }

  return skill;
}

// ── Body Progress Skill ────────────────────────────────────────────────

/**
 * Generates body measurement trends and progress analysis.
 */
export function generateBodyProgressSkill(data: UserSkillData): string {
  const { latestBody, bodyHistory } = data;

  let skill = `## KÖRPERENTWICKLUNG\n`;

  if (latestBody) {
    skill += `\n### Aktuelle Werte (${latestBody.date})\n`;
    if (latestBody.weight_kg) skill += `- Gewicht: ${latestBody.weight_kg} kg\n`;
    if (latestBody.body_fat_pct) skill += `- Körperfett: ${latestBody.body_fat_pct}%\n`;
    if (latestBody.muscle_mass_kg) skill += `- Muskelmasse: ${latestBody.muscle_mass_kg} kg\n`;
    if (latestBody.water_pct) skill += `- Wasseranteil: ${latestBody.water_pct}%\n`;
    if (latestBody.waist_cm) skill += `- Bauchumfang: ${latestBody.waist_cm} cm\n`;
  }

  if (bodyHistory && bodyHistory.length >= 2) {
    skill += `\n### Trend (letzte ${bodyHistory.length} Messungen)\n`;

    // Weight trend
    const weights = bodyHistory
      .filter(b => b.weight_kg != null)
      .map(b => ({ date: b.date, value: b.weight_kg! }));

    if (weights.length >= 2) {
      const newest = weights[0];
      const oldest = weights[weights.length - 1];
      const diff = newest.value - oldest.value;
      const daysBetween = Math.max(1, Math.floor(
        (new Date(newest.date).getTime() - new Date(oldest.date).getTime()) / (1000 * 60 * 60 * 24)
      ));
      const weeklyRate = (diff / daysBetween) * 7;

      skill += `- Gewicht: ${oldest.value} → ${newest.value} kg (${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg in ${daysBetween} Tagen)\n`;
      skill += `- Wöchentliche Rate: ${weeklyRate > 0 ? '+' : ''}${weeklyRate.toFixed(2)} kg/Woche\n`;

      if (newest.value > 0) {
        const pctPerWeek = (weeklyRate / newest.value) * 100;
        skill += `- Relative Rate: ${pctPerWeek > 0 ? '+' : ''}${pctPerWeek.toFixed(2)}%/Woche\n`;
      }
    }

    // Body fat trend
    const fats = bodyHistory
      .filter(b => b.body_fat_pct != null)
      .map(b => ({ date: b.date, value: b.body_fat_pct! }));

    if (fats.length >= 2) {
      const diff = fats[0].value - fats[fats.length - 1].value;
      skill += `- Körperfett: ${fats[fats.length - 1].value}% → ${fats[0].value}% (${diff > 0 ? '+' : ''}${diff.toFixed(1)} Prozentpunkte)\n`;
    }
  }

  return skill;
}

// ── Substance Protocol Skill ───────────────────────────────────────────

/**
 * Generates the user's current substance protocol for context.
 */
export function generateSubstanceProtocolSkill(data: UserSkillData): string {
  const { activeSubstances, recentSubstanceLogs, recentBloodPressure } = data;

  let skill = `## SUBSTANZ-PROTOKOLL\n`;

  if (activeSubstances && activeSubstances.length > 0) {
    skill += `\n### Aktive Substanzen\n`;
    activeSubstances.forEach((s) => {
      skill += `- **${s.name}**`;
      if (s.category) skill += ` [${substanceCategoryDE(s.category)}]`;
      if (s.dosage) skill += `: ${s.dosage} ${s.unit ?? ''}`;
      if (s.frequency) skill += ` (${s.frequency})`;
      if (s.ester) skill += ` — Ester: ${s.ester}`;
      if (s.half_life_days) skill += `, HWZ: ${s.half_life_days} Tage`;
      if (s.type) skill += ` [${adminTypeDE(s.type)}]`;
      skill += `\n`;
    });
  } else {
    skill += `> Keine aktiven Substanzen eingetragen.\n`;
  }

  if (recentSubstanceLogs && recentSubstanceLogs.length > 0) {
    skill += `\n### Letzte Einnahmen/Injektionen\n`;
    recentSubstanceLogs.slice(0, 10).forEach((log) => {
      skill += `- ${log.date}${log.time ? ' ' + log.time : ''}: ${log.substance_name ?? 'Substanz'}`;
      if (log.dosage_taken) skill += ` — ${log.dosage_taken}`;
      if (log.site) skill += ` [${injectionSiteDE(log.site)}]`;
      if (!log.taken) skill += ` ⚠️ NICHT eingenommen`;
      skill += `\n`;
    });

    // Check for missed doses
    const missed = recentSubstanceLogs.filter(l => !l.taken);
    if (missed.length > 0) {
      skill += `\n> ⚠️ ${missed.length} verpasste Einnahme(n) in letzter Zeit!\n`;
    }
  }

  if (recentBloodPressure && recentBloodPressure.length > 0) {
    skill += `\n### Blutdruck (letzte Messungen)\n`;
    recentBloodPressure.slice(0, 5).forEach((bp) => {
      skill += `- ${bp.date} ${bp.time}: ${bp.systolic}/${bp.diastolic} mmHg`;
      if (bp.pulse) skill += `, Puls ${bp.pulse}`;
      if (bp.classification) skill += ` [${bpClassDE(bp.classification)}]`;
      skill += `\n`;
    });

    // BP trend warning
    const avgSys = recentBloodPressure.reduce((sum, bp) => sum + bp.systolic, 0) / recentBloodPressure.length;
    const avgDia = recentBloodPressure.reduce((sum, bp) => sum + bp.diastolic, 0) / recentBloodPressure.length;
    skill += `\n> Durchschnitt: ${Math.round(avgSys)}/${Math.round(avgDia)} mmHg\n`;
    if (avgSys >= 140 || avgDia >= 90) {
      skill += `> 🔴 ACHTUNG: Durchschnittlicher Blutdruck erhöht! Arzt konsultieren.\n`;
    }
  }

  return skill;
}

// ── Daily Summary Skill (kombiniert) ───────────────────────────────────

/**
 * Generates a compact daily summary for the general chat agent.
 * This is a lighter version — agents can request full skills separately.
 */
export function generateDailySummarySkill(data: UserSkillData): string {
  let skill = `## TAGESÜBERSICHT\n\n`;

  // Compact profile
  if (data.profile) {
    const p = data.profile;
    skill += `Nutzer: ${p.display_name ?? 'Nutzer'}`;
    if (data.latestBody?.weight_kg) skill += `, ${data.latestBody.weight_kg}kg`;
    if (p.height_cm) skill += `, ${p.height_cm}cm`;
    if (p.gender) skill += `, ${p.gender === 'male' ? 'm' : p.gender === 'female' ? 'w' : 'd'}`;
    skill += `\n`;
  }

  // Compact daily stats
  if (data.dailyStats) {
    const s = data.dailyStats;
    skill += `Heute: ${s.calories}/${s.caloriesGoal} kcal, ${s.protein}/${s.proteinGoal}g P, ${s.water}/${s.waterGoal} Wasser\n`;
  }

  // Active substances (short)
  if (data.activeSubstances && data.activeSubstances.length > 0) {
    skill += `Substanzen: ${data.activeSubstances.map(s => s.name).join(', ')}\n`;
  }

  // Latest body (short)
  if (data.latestBody) {
    const b = data.latestBody;
    skill += `Körper (${b.date}): ${b.weight_kg ?? '?'}kg`;
    if (b.body_fat_pct) skill += `, ${b.body_fat_pct}% KFA`;
    skill += `\n`;
  }

  return skill;
}

// ── Active Plan Skill ─────────────────────────────────────────────────

/**
 * Generates the user's active training plan for the training agent.
 */
export function generateActivePlanSkill(data: UserSkillData): string {
  const { activePlan } = data;
  if (!activePlan?.days?.length) return '';

  let skill = `## AKTIVER TRAININGSPLAN: ${activePlan.name}\n`;
  skill += `Split: ${activePlan.split_type}, ${activePlan.days_per_week}x/Woche\n\n`;

  for (const day of activePlan.days) {
    skill += `### Tag ${day.day_number}: ${day.name}`;
    if (day.focus) skill += ` (${day.focus})`;
    skill += `\n`;
    for (const ex of day.exercises) {
      skill += `- ${ex.name}: ${ex.sets}×${ex.reps}`;
      if (ex.weight_kg) skill += ` @ ${ex.weight_kg}kg`;
      skill += `\n`;
    }
    skill += `\n`;
  }

  return skill;
}

// ── Known Products Skill ──────────────────────────────────────────────

/**
 * Generates a list of known products (user + standard) for the nutrition agent.
 * The agent uses this to look up exact nutritional values instead of estimating.
 */
export function generateKnownProductsSkill(data: UserSkillData): string {
  const { userProducts, standardProducts } = data;
  const hasUser = userProducts && userProducts.length > 0;
  const hasStandard = standardProducts && standardProducts.length > 0;

  if (!hasUser && !hasStandard) return '';

  let skill = `## BEKANNTE PRODUKTE (Nährwert-Datenbank)\n`;
  skill += `> Verwende bei Übereinstimmung die EXAKTEN Werte aus dieser Liste statt zu schätzen.\n`;
  skill += `> Markiere Werte aus dieser DB als "(exakt)" statt "(geschätzt)".\n\n`;

  if (hasUser) {
    skill += `### User-Produkte (individuell gespeichert)\n`;
    // Sort by use_count descending
    const sorted = [...userProducts!].sort((a, b) => b.use_count - a.use_count);
    for (const p of sorted.slice(0, 30)) { // Limit to top 30 to save tokens
      skill += `- **${p.name}**`;
      if (p.aliases.length > 0) skill += ` [Aliases: ${p.aliases.join(', ')}]`;
      skill += ` — ${p.serving_label ?? p.serving_size_g + 'g'}`;
      skill += `: ${p.calories_per_serving} kcal | ${p.protein_per_serving}g P | ${p.carbs_per_serving}g C | ${p.fat_per_serving}g F`;
      skill += `\n`;
    }
  }

  if (hasStandard) {
    skill += `\n### Standard-Produkte (Basis-Lebensmittel)\n`;
    for (const p of standardProducts!) {
      skill += `- ${p.name} — ${p.serving_label ?? p.serving_size_g + 'g'}: ${p.calories_per_serving} kcal | ${p.protein_per_serving}g P | ${p.carbs_per_serving}g C | ${p.fat_per_serving}g F\n`;
    }
  }

  return skill;
}

// ── Skill Aggregator ───────────────────────────────────────────────────

/**
 * Generate multiple user skills at once.
 * Agents call this with the skills they need.
 */
export function generateUserSkills(
  data: UserSkillData,
  requestedSkills: UserSkillType[]
): string {
  const parts: string[] = [];

  for (const skillType of requestedSkills) {
    switch (skillType) {
      case 'profile':
        parts.push(generateProfileSkill(data));
        break;
      case 'nutrition_log':
        parts.push(generateNutritionLogSkill(data));
        break;
      case 'training_log':
        parts.push(generateTrainingLogSkill(data));
        break;
      case 'body_progress':
        parts.push(generateBodyProgressSkill(data));
        break;
      case 'substance_protocol':
        parts.push(generateSubstanceProtocolSkill(data));
        break;
      case 'daily_summary':
        parts.push(generateDailySummarySkill(data));
        break;
      case 'active_plan':
        parts.push(generateActivePlanSkill(data));
        break;
      case 'known_products':
        parts.push(generateKnownProductsSkill(data));
        break;
    }
  }

  return parts.filter(Boolean).join('\n\n');
}

// ── Helper Functions ───────────────────────────────────────────────────

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function mealTypeDE(type: string): string {
  const map: Record<string, string> = {
    breakfast: 'Frühstück',
    lunch: 'Mittagessen',
    dinner: 'Abendessen',
    snack: 'Snack',
  };
  return map[type] ?? type;
}

function workoutTypeDE(type: string): string {
  const map: Record<string, string> = {
    strength: 'Kraft',
    cardio: 'Cardio',
    flexibility: 'Beweglichkeit',
    hiit: 'HIIT',
    sports: 'Sport',
    other: 'Sonstiges',
  };
  return map[type] ?? type;
}

function substanceCategoryDE(cat: string): string {
  const map: Record<string, string> = {
    trt: 'TRT',
    ped: 'PED',
    medication: 'Medikament',
    supplement: 'Supplement',
    other: 'Sonstiges',
  };
  return map[cat] ?? cat;
}

function adminTypeDE(type: string): string {
  const map: Record<string, string> = {
    injection: 'Injektion',
    oral: 'Oral',
    transdermal: 'Transdermal',
    subcutaneous: 'Subkutan',
    other: 'Sonstiges',
  };
  return map[type] ?? type;
}

function injectionSiteDE(site: string): string {
  const map: Record<string, string> = {
    glute_left: 'Gluteus links',
    glute_right: 'Gluteus rechts',
    delt_left: 'Delt links',
    delt_right: 'Delt rechts',
    quad_left: 'Quad links',
    quad_right: 'Quad rechts',
    ventro_glute_left: 'Ventro-Gluteal links',
    ventro_glute_right: 'Ventro-Gluteal rechts',
    abdomen: 'Bauch',
    other: 'Andere',
  };
  return map[site] ?? site;
}

function bpClassDE(classification: string): string {
  const map: Record<string, string> = {
    optimal: 'Optimal',
    normal: 'Normal',
    high_normal: 'Hochnormal',
    hypertension_1: 'Hypertonie Grad 1',
    hypertension_2: 'Hypertonie Grad 2',
    hypertension_3: 'Hypertonie Grad 3',
  };
  return map[classification] ?? classification;
}
