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
  Equipment,
  MenstrualCycleLog,
} from '../../../types/health';
import type { Recipe } from '../../../features/recipes/types';
import type { StoredPreference } from '../nutritionPreferenceEngine';

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
  availableEquipment?: Equipment[];
  recentCycleLogs?: MenstrualCycleLog[];
  favoriteRecipes?: Recipe[];
  allRecipes?: Recipe[];
  nutritionPreferences?: StoredPreference[];
  pantryItems?: Array<{ ingredient_name: string; category: string; quantity_text: string | null; status: string; buy_preference: string; expires_at: string | null }>;
}

export type UserSkillType =
  | 'profile'
  | 'nutrition_log'
  | 'training_log'
  | 'body_progress'
  | 'substance_protocol'
  | 'daily_summary'
  | 'active_plan'
  | 'known_products'
  | 'available_equipment'
  | 'cycle_log'
  | 'recipe_favorites'
  | 'nutrition_preferences'
  | 'pantry_inventory';

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

  // Personal goals — the buddy should know and reference these
  const goals = profile.personal_goals;
  if (goals) {
    const goalLabels: Record<string, string> = {
      muscle_gain: 'Muskelaufbau',
      fat_loss: 'Fettabbau',
      health: 'Gesundheit',
      performance: 'Leistung',
      body_recomp: 'Body Recomposition',
    };
    skill += `\n### Persoenliche Ziele\n`;
    if (goals.primary_goal) skill += `- Hauptziel: ${goalLabels[goals.primary_goal] ?? goals.primary_goal}\n`;
    if (goals.target_weight_kg) {
      skill += `- Zielgewicht: ${goals.target_weight_kg} kg`;
      if (latestBody?.weight_kg) {
        const diff = latestBody.weight_kg - goals.target_weight_kg;
        skill += ` (noch ${diff > 0 ? '-' : '+'}${Math.abs(diff).toFixed(1)} kg)`;
      }
      skill += '\n';
    }
    if (goals.target_body_fat_pct) skill += `- Ziel-KFA: ${goals.target_body_fat_pct}%\n`;
    if (goals.target_date) skill += `- Zieldatum: ${goals.target_date}\n`;
    if (goals.notes) skill += `- Notizen: "${goals.notes}"\n`;
  }

  // Dietary preferences, allergies & health restrictions — SAFETY-CRITICAL
  // Agents MUST consider these when making recommendations (e.g. no peanuts for allergy!)
  const hasDietary = profile.dietary_preferences && profile.dietary_preferences.length > 0;
  const hasAllergies = profile.allergies && profile.allergies.length > 0;
  const hasRestrictions = profile.health_restrictions && profile.health_restrictions.length > 0;

  if (hasDietary || hasAllergies || hasRestrictions) {
    skill += `\n### Ernaehrung & Gesundheit ⚠️ SICHERHEITSKRITISCH\n`;
    if (hasDietary) {
      skill += `- Ernaehrungsform: ${profile.dietary_preferences!.map(d => dietLabelDE(d)).join(', ')}\n`;
    }
    if (hasAllergies) {
      skill += `- ⚠️ ALLERGIEN/UNVERTRAEGLICHKEITEN: ${profile.allergies!.map(a => allergyLabelDE(a)).join(', ')}\n`;
      skill += `  → NIEMALS Lebensmittel/Rezepte mit diesen Allergenen empfehlen!\n`;
      skill += `  → Bei Mahlzeiten-Logging WARNEN wenn ein Allergen enthalten sein koennte!\n`;
      skill += `  → Beispiel: Bei Histaminintoleranz vor gereiftem Kaese, Rotwein, Salami, Sauerkraut warnen.\n`;
    }
    if (hasRestrictions) {
      skill += `- ⚠️ GESUNDHEITLICHE EINSCHRAENKUNGEN: ${profile.health_restrictions!.map(r => restrictionLabelDE(r)).join(', ')}\n`;
      skill += `  → Bei Trainingsempfehlungen IMMER beruecksichtigen!\n`;
      skill += `  → Bei Ernaehrungsempfehlungen beruecksichtigen (z.B. Diabetes → Blutzucker-freundlich, Bluthochdruck → salzarm)!\n`;
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

// ── Cycle Log Skill ──────────────────────────────────────────────────

/**
 * Generates the user's recent menstrual cycle data.
 * Helps AI agents give cycle-phase-aware advice for training and nutrition.
 */
export function generateCycleLogSkill(data: UserSkillData): string {
  const { recentCycleLogs, profile } = data;
  if (!recentCycleLogs || recentCycleLogs.length === 0) return '';

  // Only include for users who have cycle data
  const phaseLabels: Record<string, string> = {
    menstruation: 'Menstruation (Tag 1-5)',
    follicular: 'Follikelphase (Tag 6-13)',
    ovulation: 'Eisprung (~Tag 14)',
    luteal: 'Lutealphase (Tag 15-28)',
  };

  const symptomLabels: Record<string, string> = {
    cramping: 'Kraempfe', bloating: 'Blaehungen', mood_changes: 'Stimmungsschwankungen',
    fatigue: 'Muedigkeit', acne: 'Akne', headache: 'Kopfschmerzen',
    breast_tenderness: 'Brustspannen', water_retention: 'Wassereinlagerung',
    sleep_issues: 'Schlafprobleme', hot_flashes: 'Hitzewallungen',
    urinary_frequency: 'Haeufiger Harndrang', concentration_issues: 'Konzentrationsschwaeche',
    libido_changes: 'Libido-Veraenderungen', back_pain: 'Rueckenschmerzen',
    joint_pain: 'Gelenkschmerzen', nausea: 'Uebelkeit', dizziness: 'Schwindel',
    appetite_changes: 'Appetit-Veraenderungen', skin_changes: 'Hautveraenderungen',
    irritability: 'Reizbarkeit',
  };

  let skill = `## MENSTRUATIONSZYKLUS\n`;

  // Latest entry = current phase estimate
  const latest = recentCycleLogs[0];
  skill += `Aktuelle Phase: **${phaseLabels[latest.phase] ?? latest.phase}** (${latest.date})\n`;

  if (latest.energy_level) skill += `Energie heute: ${latest.energy_level}/5\n`;
  if (latest.mood) skill += `Stimmung heute: ${latest.mood}/5\n`;

  const symptoms = latest.symptoms ?? [];
  if (symptoms.length > 0) {
    skill += `Aktuelle Symptome: ${symptoms.map(s => symptomLabels[s] ?? s).join(', ')}\n`;
  }

  if (latest.phase === 'menstruation' && latest.flow_intensity) {
    skill += `Blutungsstaerke: ${latest.flow_intensity === 'light' ? 'leicht' : latest.flow_intensity === 'normal' ? 'normal' : 'stark'}\n`;
  }

  // Phase-specific context for the agent
  skill += `\n### Phasen-Kontext fuer Empfehlungen\n`;
  switch (latest.phase) {
    case 'menstruation':
      skill += `- Leichtes bis moderates Training empfehlen (Endorphine lindern Kraempfe)\n`;
      skill += `- Ernaehrung: Eisenreiche Lebensmittel priorisieren (Blutverlust), Magnesium gegen Kraempfe\n`;
      skill += `- Kein erzwungener Deload — nach Befinden trainieren\n`;
      break;
    case 'follicular':
      skill += `- Beste Phase fuer intensives Krafttraining, HIIT, PR-Versuche\n`;
      skill += `- OEstrogen steigt → Muskelproteinsynthese erhoet, Schmerztoleranz hoeher\n`;
      skill += `- Carbs werden optimal verwertet\n`;
      break;
    case 'ovulation':
      skill += `- Leistungs-Peak, aber VORSICHT: ACL-Verletzungsrisiko erhoeht\n`;
      skill += `- Technik-Fokus bei Spruengen/Richtungswechseln empfehlen\n`;
      skill += `- Gutes Aufwaermen besonders wichtig\n`;
      break;
    case 'luteal':
      skill += `- RPE kann subjektiv hoeher ausfallen — das ist NORMAL\n`;
      skill += `- Moderate Intensitaet empfehlen, letzte Woche = natuerlicher Deload\n`;
      skill += `- Ernaehrung: +100-300 kcal/Tag normal (erhoehter Grundumsatz durch Progesteron)\n`;
      skill += `- Heisshunger ist physiologisch — komplexe Carbs empfehlen, nicht als Kontrollverlust framen\n`;
      skill += `- Protein tendenziell hoeher (Progesteron ist katabol)\n`;
      break;
  }

  // Recent history for pattern
  if (recentCycleLogs.length > 1) {
    skill += `\n### Letzte Eintraege\n`;
    for (const log of recentCycleLogs.slice(0, 7)) {
      const s = (log.symptoms ?? []).length;
      skill += `- ${log.date}: ${phaseLabels[log.phase] ?? log.phase}`;
      if (log.energy_level) skill += `, Energie ${log.energy_level}/5`;
      if (log.mood) skill += `, Stimmung ${log.mood}/5`;
      if (s > 0) skill += `, ${s} Symptom${s > 1 ? 'e' : ''}`;
      skill += `\n`;
    }
  }

  // Breastfeeding context
  if (profile?.is_breastfeeding) {
    skill += `\n> 🤱 Stillzeit: +400 kcal/Tag beruecksichtigt (Dewey 2003)\n`;
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
      // Adaptive format: strength vs endurance
      const isEndurance = ex.exercise_type === 'cardio' || (ex.duration_minutes != null && ex.sets == null);
      if (isEndurance) {
        const parts: string[] = [ex.name + ':'];
        if (ex.duration_minutes) parts.push(`${ex.duration_minutes} Min`);
        if (ex.distance_km) parts.push(`${ex.distance_km} km`);
        if (ex.pace) parts.push(`@ ${ex.pace}`);
        if (ex.intensity) parts.push(`(${ex.intensity})`);
        skill += `- ${parts.join(' ')}\n`;
      } else {
        skill += `- ${ex.name}: ${ex.sets ?? '?'}×${ex.reps ?? '?'}`;
        if (ex.weight_kg) skill += ` @ ${ex.weight_kg}kg`;
        skill += `\n`;
      }
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

// ── Available Equipment Skill ─────────────────────────────────────────

/**
 * Generates the user's available equipment list for the training agent.
 * The agent uses this to recommend ONLY exercises the user can actually perform.
 */
export function generateAvailableEquipmentSkill(data: UserSkillData): string {
  const { availableEquipment } = data;
  if (!availableEquipment || availableEquipment.length === 0) {
    return `## VERFÜGBARE GERÄTE\n> Keine Geräte hinterlegt. Frage den Nutzer nach seinen verfügbaren Geräten oder erstelle Körpergewichts-Übungen.\n`;
  }

  const categoryLabels: Record<string, string> = {
    free_weight: 'Freigewichte',
    machine: 'Maschinen',
    cable: 'Kabelzug',
    bodyweight: 'Körpergewicht / Calisthenics',
    cardio: 'Cardio-Geräte',
    other: 'Sonstiges',
  };

  // Group by category
  const grouped: Record<string, Equipment[]> = {};
  for (const eq of availableEquipment) {
    if (!grouped[eq.category]) grouped[eq.category] = [];
    grouped[eq.category].push(eq);
  }

  let skill = `## VERFÜGBARE GERÄTE (${availableEquipment.length} Stück)\n`;
  skill += `> WICHTIG: Verwende NUR Übungen, die mit diesen Geräten möglich sind!\n`;
  skill += `> Wenn ein Gerät NICHT in der Liste ist, schlage eine Alternative mit verfügbaren Geräten vor.\n\n`;

  for (const [cat, items] of Object.entries(grouped)) {
    skill += `### ${categoryLabels[cat] ?? cat}\n`;
    for (const eq of items) {
      skill += `- ${eq.name}`;
      if (eq.muscle_groups.length > 0) {
        skill += ` (${eq.muscle_groups.join(', ')})`;
      }
      skill += `\n`;
    }
    skill += `\n`;
  }

  return skill;
}

// ── Recipe Favorites Skill ─────────────────────────────────────────────

/**
 * Generates the user's recipe collection context — favorites first, then other recipes.
 * Allows the nutrition agent to recommend existing user recipes with proper prioritization.
 */
export function generateRecipeFavoritesSkill(data: UserSkillData): string {
  const favorites = data.favoriteRecipes || [];
  const others = data.allRecipes || [];
  if (favorites.length === 0 && others.length === 0) return '';

  const formatRecipe = (r: Recipe): string => {
    const macros = `${r.calories_per_serving} kcal | ${r.protein_per_serving}g P | ${r.carbs_per_serving}g C | ${r.fat_per_serving}g F`;
    const time = r.prep_time_min + r.cook_time_min;
    const tags = r.tags.length > 0 ? r.tags.join(', ') : '-';
    const mealType = r.meal_type ? ` [${r.meal_type}]` : '';
    const allergens = r.allergens.length > 0 ? ` ⚠️ ${r.allergens.join(', ')}` : '';
    return `- **${r.title}**${mealType} (${r.servings} Port., ${time} Min.) — ${macros} | Tags: ${tags}${allergens}`;
  };

  const sections: string[] = [
    '## 📖 REZEPT-SAMMLUNG DES USERS',
    '',
    '### PRIORISIERUNG BEI EMPFEHLUNGEN:',
    '1. ⭐ FAVORITEN zuerst (User kennt und mag diese)',
    '2. 📋 Eigene Rezepte aus der Sammlung',
    '3. 💡 Neue Vorschlaege nur wenn nichts Passendes in der Sammlung',
    '⚠️ WICHTIG: Vorschlaege MUESSEN zur Anfrage passen (meal_type, Makros, Zeitbudget). Ein Mittagessen-Favorit NICHT als Snack vorschlagen!',
    '',
  ];

  if (favorites.length > 0) {
    sections.push(`### ⭐ Favoriten (${favorites.length}):`);
    sections.push('');
    sections.push(...favorites.slice(0, 15).map(formatRecipe));
    sections.push('');
  }

  if (others.length > 0) {
    sections.push(`### 📋 Weitere Rezepte (${others.length}):`);
    sections.push('');
    sections.push(...others.slice(0, 20).map(formatRecipe));
    sections.push('');
  }

  return sections.join('\n');
}

// ── Nutrition Preferences Skill ────────────────────────────────────────

/**
 * Generates the user's learned nutrition preferences for the agent.
 * Only includes preferences with confidence >= 0.4.
 */
export function generateNutritionPreferencesSkill(data: UserSkillData): string {
  const prefs = data.nutritionPreferences;
  if (!prefs || prefs.length === 0) return '';

  const relevant = prefs.filter(p => p.confidence >= 0.4);
  if (relevant.length === 0) return '';

  // Group by preference_type
  const grouped: Record<string, typeof relevant> = {};
  for (const p of relevant) {
    if (!grouped[p.preference_type]) grouped[p.preference_type] = [];
    grouped[p.preference_type].push(p);
  }

  let skill = `## GELERNTE ERNAEHRUNGS-PRAEFERENZEN\n`;
  skill += `> Automatisch gelernt aus Gespraechen und Essgewohnheiten. Beruecksichtige bei Vorschlaegen.\n\n`;

  if (grouped.disliked_ingredient?.length) {
    skill += `### Mag NICHT (meiden!):\n`;
    for (const p of grouped.disliked_ingredient.slice(0, 10)) {
      skill += `- ${p.value} (${confidenceLabel(p.confidence)})\n`;
    }
  }

  if (grouped.liked_ingredient?.length) {
    skill += `### Mag gern (bevorzugen):\n`;
    for (const p of grouped.liked_ingredient.slice(0, 10)) {
      skill += `- ${p.value} (${confidenceLabel(p.confidence)})\n`;
    }
  }

  if (grouped.cuisine_preference?.length) {
    skill += `### Kueche-Praeferenzen:\n`;
    for (const p of grouped.cuisine_preference.slice(0, 5)) {
      skill += `- ${p.value} (${confidenceLabel(p.confidence)})\n`;
    }
  }

  if (grouped.cooking_style?.length) {
    skill += `### Kochstil:\n`;
    for (const p of grouped.cooking_style.slice(0, 5)) {
      skill += `- ${p.value} (${confidenceLabel(p.confidence)})\n`;
    }
  }

  if (grouped.dietary_pattern?.length) {
    skill += `### Ernaehrungsmuster:\n`;
    for (const p of grouped.dietary_pattern.slice(0, 5)) {
      skill += `- ${p.value} (${confidenceLabel(p.confidence)})\n`;
    }
  }

  if (grouped.portion_size?.length) {
    skill += `### Portionsgroesse:\n`;
    for (const p of grouped.portion_size.slice(0, 3)) {
      skill += `- ${p.value} (${confidenceLabel(p.confidence)})\n`;
    }
  }

  return skill;
}

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return 'sicher';
  if (confidence >= 0.6) return 'wahrscheinlich';
  return 'vermutet';
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
      case 'available_equipment':
        parts.push(generateAvailableEquipmentSkill(data));
        break;
      case 'cycle_log':
        parts.push(generateCycleLogSkill(data));
        break;
      case 'recipe_favorites':
        parts.push(generateRecipeFavoritesSkill(data));
        break;
      case 'nutrition_preferences':
        parts.push(generateNutritionPreferencesSkill(data));
        break;
      case 'pantry_inventory':
        parts.push(generatePantryInventorySkill(data));
        break;
    }
  }

  return parts.filter(Boolean).join('\n\n');
}

// ── Pantry Inventory Skill ─────────────────────────────────────────────

const CATEGORY_LABELS_DE: Record<string, string> = {
  gemuese: 'Gemüse',
  obst: 'Obst',
  fleisch_fisch: 'Fleisch & Fisch',
  milchprodukte: 'Milchprodukte & Eier',
  getreide_nudeln: 'Getreide & Nudeln',
  huelsenfruechte: 'Hülsenfrüchte & Samen',
  nuesse: 'Nüsse & Trockenfrüchte',
  oele_fette: 'Öle & Fette',
  gewuerze: 'Gewürze & Kräuter',
  konserven: 'Konserven & Saucen',
  backzutaten: 'Backzutaten',
  getraenke: 'Getränke',
  tiefkuehl: 'Tiefkühl',
  brot_aufstriche: 'Brot & Aufstriche',
  supplements: 'Supplements & Proteine',
  sonstiges: 'Sonstiges',
};

function generatePantryInventorySkill(data: UserSkillData): string {
  const { pantryItems } = data;
  if (!pantryItems || pantryItems.length === 0) {
    return `## VORRAT\nDer Nutzer hat noch keinen Vorrat angelegt. Schlage ihm vor, seinen Vorrat einzurichten ("Sag mir was du zu Hause hast" oder "Vorrat einrichten").`;
  }

  const available = pantryItems.filter(i => i.status === 'available');
  const low = pantryItems.filter(i => i.status === 'low');
  const neverBuy = pantryItems.filter(i => i.buy_preference === 'never');

  let skill = `## VORRAT (${available.length} verfügbar, ${low.length} wenig)\n`;

  // Group by category
  const grouped = new Map<string, typeof pantryItems>();
  for (const item of [...available, ...low]) {
    const cat = item.category || 'sonstiges';
    const arr = grouped.get(cat) ?? [];
    arr.push(item);
    grouped.set(cat, arr);
  }

  for (const [cat, items] of grouped) {
    const label = CATEGORY_LABELS_DE[cat] ?? cat;
    skill += `\n### ${label}\n`;
    for (const item of items) {
      const qty = item.quantity_text ? ` (${item.quantity_text})` : '';
      const status = item.status === 'low' ? ' ⚠️ wenig' : '';
      const expiry = item.expires_at ? ` [MHD: ${item.expires_at}]` : '';
      skill += `- ${item.ingredient_name}${qty}${status}${expiry}\n`;
    }
  }

  // Expiring soon (next 3 days)
  const today = new Date();
  const threeDays = new Date(today.getTime() + 3 * 86400000);
  const expiring = pantryItems.filter(i =>
    i.expires_at && new Date(i.expires_at) <= threeDays && i.status !== 'empty'
  );
  if (expiring.length > 0) {
    skill += `\n### ⚠️ Bald ablaufend\n`;
    for (const item of expiring) {
      skill += `- ${item.ingredient_name} (${item.expires_at})\n`;
    }
  }

  // Never-buy items (relevant for recipe suggestions)
  if (neverBuy.length > 0) {
    skill += `\n### ❌ Kauft/isst der Nutzer NICHT\n`;
    skill += neverBuy.map(i => i.ingredient_name).join(', ') + '\n';
  }

  skill += `\n### REGELN FÜR VORRAT-INTERAKTION\n`;
  skill += `- Wenn der Nutzer sagt "Ich habe eingekauft: ..." → update_pantry action mit action="add"\n`;
  skill += `- Wenn der Nutzer sagt "X ist alle/leer" → update_pantry action mit action="set_status", status="empty"\n`;
  skill += `- Wenn der Nutzer sagt "X wird knapp" → update_pantry action mit action="set_status", status="low"\n`;
  skill += `- Wenn der Nutzer fragt "Was kann ich kochen?" → Rezepte basierend auf verfügbaren Zutaten vorschlagen\n`;
  skill += `- Priorisiere Rezepte die bald ablaufende Zutaten verwenden\n`;

  return skill;
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

function dietLabelDE(key: string): string {
  const map: Record<string, string> = {
    omnivore: 'Mischkost (isst alles)',
    vegetarian: 'Vegetarisch',
    vegan: 'Vegan',
    pescatarian: 'Pescetarisch',
    keto: 'Ketogen',
    paleo: 'Paleo',
    glutenFree: 'Glutenfrei',
    gluten_free: 'Glutenfrei',
    lactoseFree: 'Laktosefrei',
    lactose_free: 'Laktosefrei',
    halal: 'Halal',
    kosher: 'Koscher',
  };
  return map[key] ?? key;
}

function allergyLabelDE(key: string): string {
  const map: Record<string, string> = {
    nuts: 'Nüsse (Baumnüsse)',
    peanuts: 'Erdnüsse',
    gluten: 'Gluten',
    lactose: 'Laktose (Milchzucker)',
    milk_protein: 'Milcheiweiß (Kasein/Molke)',
    shellfish: 'Schalentiere (Krebstiere)',
    mollusks: 'Weichtiere (Mollusken)',
    soy: 'Soja',
    eggs: 'Eier',
    fructose: 'Fruktose (Fruchtzucker)',
    histamine: 'Histamin (gereifter Käse, Rotwein, Salami, fermentierte Lebensmittel meiden!)',
    celery: 'Sellerie',
    mustard: 'Senf',
    sesame: 'Sesam',
    lupins: 'Lupinen',
    sulfites: 'Sulfite (Schwefeldioxid, in Wein, Trockenfrüchten)',
    wheat: 'Weizen',
  };
  return map[key] ?? key;
}

function restrictionLabelDE(key: string): string {
  const map: Record<string, string> = {
    back: 'Rückenprobleme',
    shoulder: 'Schulterprobleme',
    knee: 'Knieprobleme',
    hip: 'Hüftprobleme',
    elbow: 'Ellbogenprobleme',
    wrist: 'Handgelenksprobleme',
    ankle: 'Sprunggelenksprobleme',
    neck: 'Nackenprobleme',
    disc: 'Bandscheibenvorfall',
    heart: 'Herzerkrankung',
    hypertension: 'Bluthochdruck (Hypertonie)',
    diabetes_type1: 'Diabetes Typ 1 (insulinpflichtig)',
    diabetes_type2: 'Diabetes Typ 2',
    asthma: 'Asthma',
    thyroid: 'Schilddrüsenerkrankung (Hashimoto/Hypothyreose)',
    osteoporosis: 'Osteoporose',
    diastasis_recti: 'Rektusdiastase',
  };
  return map[key] ?? key;
}
