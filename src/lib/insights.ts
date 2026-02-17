/**
 * Insights Engine — rule-based recommendations and alerts.
 *
 * Analyzes user data and generates actionable, prioritized insights.
 * All logic is deterministic (hardcoded rules, no AI).
 *
 * Categories:
 * - calorie_balance: Soll vs. Ist Kalorien
 * - protein_check: Proteinversorgung basierend auf Trainingsstatus
 * - bp_warning: Blutdruck-Warnung bei kritischen Werten
 * - bp_trend: Blutdruck-Trend ueber mehrere Messungen
 * - weight_trend: Gewichtsentwicklung
 * - body_fat_trend: KFA-Entwicklung
 * - hydration: Wasser-Ziel
 * - no_data: Fehlende Daten (Profil, Messungen, etc.)
 *
 * @reference docs/WISSENSCHAFTLICHE_GRUNDLAGEN.md
 * @reference docs/ARCHITEKTUR.md Section 4 (KI vs. Hardcode)
 */

import { classifyBloodPressure, detectBPTrend } from './calculations';
import type { BloodPressure, BodyMeasurement } from '../types/health';

// ── Types ───────────────────────────────────────────────────────────────

export type InsightSeverity = 'info' | 'success' | 'warning' | 'critical';
export type InsightCategory =
  | 'calorie_balance'
  | 'protein_check'
  | 'bp_warning'
  | 'bp_trend'
  | 'weight_trend'
  | 'body_fat_trend'
  | 'hydration'
  | 'no_data';

export interface Insight {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  icon: string;
  title: { de: string; en: string };
  message: { de: string; en: string };
  priority: number; // lower = more important (0-99)
}

// ── Input ───────────────────────────────────────────────────────────────

export interface InsightInput {
  // Calorie data (today)
  caloriesConsumed: number;
  caloriesGoal: number;
  caloriesBurned: number;

  // Protein data (today)
  proteinConsumed: number;
  proteinGoal: number;

  // Water data (today)
  waterGlasses: number;
  waterGoal: number;

  // Body measurements (sorted by date desc)
  bodyMeasurements: BodyMeasurement[];

  // Blood pressure logs (sorted by date desc)
  bpLogs: BloodPressure[];

  // Profile info
  weightKg?: number;
  hasProfile: boolean;
  hasSubstances: boolean;

  // Training context
  workoutCountToday: number;
}

// ── Engine ──────────────────────────────────────────────────────────────

export function generateInsights(input: InsightInput): Insight[] {
  const insights: Insight[] = [];

  // 1. Blood pressure warnings (highest priority)
  insights.push(...bpInsights(input));

  // 2. Calorie balance
  insights.push(...calorieInsights(input));

  // 3. Protein check
  insights.push(...proteinInsights(input));

  // 4. Weight trend
  insights.push(...weightTrendInsights(input));

  // 5. Body fat trend
  insights.push(...bodyFatTrendInsights(input));

  // 6. Hydration
  insights.push(...hydrationInsights(input));

  // 7. Missing data prompts
  insights.push(...missingDataInsights(input));

  // Sort by priority (ascending = most important first)
  return insights.sort((a, b) => a.priority - b.priority);
}

// ── Blood Pressure ──────────────────────────────────────────────────────

function bpInsights(input: InsightInput): Insight[] {
  const results: Insight[] = [];
  const { bpLogs } = input;

  if (bpLogs.length === 0) return results;

  // Latest reading classification
  const latest = bpLogs[0];
  const bpClass = classifyBloodPressure(latest.systolic, latest.diastolic);

  if (bpClass.severity >= 3) {
    // Hypertension 1+
    results.push({
      id: 'bp_high',
      category: 'bp_warning',
      severity: bpClass.severity >= 4 ? 'critical' : 'warning',
      icon: '🩺',
      title: {
        de: 'Blutdruck erhöht',
        en: 'Blood pressure elevated',
      },
      message: {
        de: `Letzter Wert: ${latest.systolic}/${latest.diastolic} mmHg. ${bpClass.severity >= 4 ? 'Bitte zeitnah einen Arzt aufsuchen!' : 'Sprich das bei deinem nächsten Arzttermin an.'}`,
        en: `Last reading: ${latest.systolic}/${latest.diastolic} mmHg. ${bpClass.severity >= 4 ? 'Please see a doctor soon!' : 'Mention this at your next doctor visit.'}`,
      },
      priority: bpClass.severity >= 4 ? 0 : 5,
    });
  } else if (bpClass.severity === 2) {
    // High-Normal
    results.push({
      id: 'bp_high_normal',
      category: 'bp_warning',
      severity: 'info',
      icon: '💛',
      title: {
        de: 'Blutdruck hoch-normal',
        en: 'Blood pressure high-normal',
      },
      message: {
        de: `${latest.systolic}/${latest.diastolic} mmHg — im Grenzbereich. Regelmäßig weiter messen.`,
        en: `${latest.systolic}/${latest.diastolic} mmHg — borderline range. Keep monitoring regularly.`,
      },
      priority: 20,
    });
  } else if (bpClass.severity <= 1) {
    results.push({
      id: 'bp_good',
      category: 'bp_warning',
      severity: 'success',
      icon: '💚',
      title: {
        de: 'Blutdruck optimal',
        en: 'Blood pressure optimal',
      },
      message: {
        de: `${latest.systolic}/${latest.diastolic} mmHg — alles im grünen Bereich!`,
        en: `${latest.systolic}/${latest.diastolic} mmHg — all good!`,
      },
      priority: 50,
    });
  }

  // BP trend (rising over 3+ readings)
  if (bpLogs.length >= 3) {
    const trend = detectBPTrend(bpLogs);
    if (trend.rising) {
      results.push({
        id: 'bp_rising',
        category: 'bp_trend',
        severity: 'warning',
        icon: '📈',
        title: {
          de: 'Blutdruck steigt',
          en: 'Blood pressure rising',
        },
        message: {
          de: `Durchschnitt der letzten Messungen: ${trend.avgSystolic}/${trend.avgDiastolic} mmHg — steigender Trend erkannt.`,
          en: `Average of recent readings: ${trend.avgSystolic}/${trend.avgDiastolic} mmHg — rising trend detected.`,
        },
        priority: 3,
      });
    }
  }

  return results;
}

// ── Calorie Balance ─────────────────────────────────────────────────────

function calorieInsights(input: InsightInput): Insight[] {
  const results: Insight[] = [];
  const { caloriesConsumed, caloriesGoal, caloriesBurned } = input;

  // Only show if user has eaten something
  if (caloriesConsumed === 0) return results;

  const net = caloriesConsumed - caloriesBurned;
  const diff = net - caloriesGoal;
  const pct = caloriesGoal > 0 ? Math.round((net / caloriesGoal) * 100) : 0;

  if (diff > 300) {
    results.push({
      id: 'cal_over',
      category: 'calorie_balance',
      severity: 'warning',
      icon: '⚠️',
      title: {
        de: 'Kalorienüberschuss',
        en: 'Calorie surplus',
      },
      message: {
        de: `+${diff} kcal über dem Ziel (${pct}%). ${caloriesBurned > 0 ? `Bereits ${caloriesBurned} kcal verbrannt.` : 'Etwas Bewegung könnte helfen.'}`,
        en: `+${diff} kcal over target (${pct}%). ${caloriesBurned > 0 ? `Already burned ${caloriesBurned} kcal.` : 'Some exercise could help.'}`,
      },
      priority: 15,
    });
  } else if (diff < -800) {
    results.push({
      id: 'cal_very_low',
      category: 'calorie_balance',
      severity: 'warning',
      icon: '⚡',
      title: {
        de: 'Sehr wenig gegessen',
        en: 'Very low intake',
      },
      message: {
        de: `Erst ${caloriesConsumed} kcal aufgenommen — ${Math.abs(diff)} kcal unter dem Ziel. Achte auf ausreichende Versorgung.`,
        en: `Only ${caloriesConsumed} kcal consumed — ${Math.abs(diff)} kcal below target. Make sure to eat enough.`,
      },
      priority: 12,
    });
  } else if (Math.abs(diff) <= 100) {
    results.push({
      id: 'cal_perfect',
      category: 'calorie_balance',
      severity: 'success',
      icon: '🎯',
      title: {
        de: 'Kalorienziel erreicht',
        en: 'Calorie goal reached',
      },
      message: {
        de: `${net} von ${caloriesGoal} kcal — perfekt im Zielbereich!`,
        en: `${net} of ${caloriesGoal} kcal — right on target!`,
      },
      priority: 40,
    });
  }

  return results;
}

// ── Protein Check ───────────────────────────────────────────────────────

function proteinInsights(input: InsightInput): Insight[] {
  const results: Insight[] = [];
  const { proteinConsumed, proteinGoal } = input;

  // Only show if user has eaten something
  if (proteinConsumed === 0) return results;

  const pct = proteinGoal > 0 ? Math.round((proteinConsumed / proteinGoal) * 100) : 0;

  if (pct < 50 && proteinConsumed > 0) {
    results.push({
      id: 'protein_low',
      category: 'protein_check',
      severity: 'warning',
      icon: '🥩',
      title: {
        de: 'Protein zu niedrig',
        en: 'Protein too low',
      },
      message: {
        de: `Erst ${proteinConsumed}g von ${proteinGoal}g (${pct}%). ${input.hasSubstances ? 'Besonders wichtig bei aktiver Substanzeinnahme!' : 'Proteinreiche Mahlzeit einplanen.'}`,
        en: `Only ${proteinConsumed}g of ${proteinGoal}g (${pct}%). ${input.hasSubstances ? 'Especially important with active substance use!' : 'Plan a protein-rich meal.'}`,
      },
      priority: 10,
    });
  } else if (pct >= 90 && pct <= 120) {
    results.push({
      id: 'protein_good',
      category: 'protein_check',
      severity: 'success',
      icon: '💪',
      title: {
        de: 'Proteinversorgung gut',
        en: 'Protein intake good',
      },
      message: {
        de: `${proteinConsumed}g von ${proteinGoal}g — super Proteinversorgung heute!`,
        en: `${proteinConsumed}g of ${proteinGoal}g — great protein intake today!`,
      },
      priority: 45,
    });
  }

  return results;
}

// ── Weight Trend ────────────────────────────────────────────────────────

function weightTrendInsights(input: InsightInput): Insight[] {
  const results: Insight[] = [];
  const { bodyMeasurements } = input;

  // Need at least 2 measurements with weight
  const withWeight = bodyMeasurements.filter(m => m.weight_kg != null);
  if (withWeight.length < 2) return results;

  const latest = withWeight[0];
  const previous = withWeight[1];
  const diff = (latest.weight_kg ?? 0) - (previous.weight_kg ?? 0);

  // Calculate days between measurements
  const daysDiff = Math.max(1,
    Math.round((new Date(latest.date).getTime() - new Date(previous.date).getTime()) / (1000 * 60 * 60 * 24))
  );

  if (Math.abs(diff) < 0.3) return results; // negligible change

  // Weekly rate
  const weeklyRate = (diff / daysDiff) * 7;

  if (diff > 0) {
    // Weight gain
    if (weeklyRate > 1.0) {
      results.push({
        id: 'weight_gain_fast',
        category: 'weight_trend',
        severity: 'warning',
        icon: '📊',
        title: {
          de: 'Schnelle Gewichtszunahme',
          en: 'Rapid weight gain',
        },
        message: {
          de: `+${diff.toFixed(1)} kg in ${daysDiff} Tagen (~${weeklyRate.toFixed(1)} kg/Woche). ${input.hasSubstances ? 'Wasserretention möglich (Substanzen).' : 'Kalorienzufuhr prüfen.'}`,
          en: `+${diff.toFixed(1)} kg in ${daysDiff} days (~${weeklyRate.toFixed(1)} kg/week). ${input.hasSubstances ? 'Water retention possible (substances).' : 'Check calorie intake.'}`,
        },
        priority: 18,
      });
    } else {
      results.push({
        id: 'weight_up',
        category: 'weight_trend',
        severity: 'info',
        icon: '📈',
        title: {
          de: 'Gewicht steigt',
          en: 'Weight increasing',
        },
        message: {
          de: `+${diff.toFixed(1)} kg seit letzter Messung (~${weeklyRate.toFixed(1)} kg/Woche).`,
          en: `+${diff.toFixed(1)} kg since last measurement (~${weeklyRate.toFixed(1)} kg/week).`,
        },
        priority: 35,
      });
    }
  } else {
    // Weight loss
    if (weeklyRate < -1.0) {
      results.push({
        id: 'weight_loss_fast',
        category: 'weight_trend',
        severity: 'warning',
        icon: '📉',
        title: {
          de: 'Schneller Gewichtsverlust',
          en: 'Rapid weight loss',
        },
        message: {
          de: `${diff.toFixed(1)} kg in ${daysDiff} Tagen (~${weeklyRate.toFixed(1)} kg/Woche). Mehr als 1 kg/Woche kann Muskelverlust bedeuten.`,
          en: `${diff.toFixed(1)} kg in ${daysDiff} days (~${weeklyRate.toFixed(1)} kg/week). More than 1 kg/week may mean muscle loss.`,
        },
        priority: 14,
      });
    } else {
      results.push({
        id: 'weight_down',
        category: 'weight_trend',
        severity: 'info',
        icon: '📉',
        title: {
          de: 'Gewicht sinkt',
          en: 'Weight decreasing',
        },
        message: {
          de: `${diff.toFixed(1)} kg seit letzter Messung (~${weeklyRate.toFixed(1)} kg/Woche).`,
          en: `${diff.toFixed(1)} kg since last measurement (~${weeklyRate.toFixed(1)} kg/week).`,
        },
        priority: 35,
      });
    }
  }

  return results;
}

// ── Body Fat Trend ──────────────────────────────────────────────────────

function bodyFatTrendInsights(input: InsightInput): Insight[] {
  const results: Insight[] = [];
  const { bodyMeasurements } = input;

  const withBF = bodyMeasurements.filter(m => m.body_fat_pct != null);
  if (withBF.length < 2) return results;

  const latest = withBF[0];
  const previous = withBF[1];
  const diff = (latest.body_fat_pct ?? 0) - (previous.body_fat_pct ?? 0);

  if (Math.abs(diff) < 0.5) return results; // negligible

  if (diff < -1) {
    results.push({
      id: 'bf_down_good',
      category: 'body_fat_trend',
      severity: 'success',
      icon: '🔥',
      title: {
        de: 'Körperfett sinkt',
        en: 'Body fat decreasing',
      },
      message: {
        de: `${diff.toFixed(1)}% KFA seit letzter Messung — guter Fortschritt!`,
        en: `${diff.toFixed(1)}% body fat since last measurement — good progress!`,
      },
      priority: 30,
    });
  } else if (diff > 1) {
    results.push({
      id: 'bf_up',
      category: 'body_fat_trend',
      severity: 'info',
      icon: '📊',
      title: {
        de: 'Körperfett steigt',
        en: 'Body fat increasing',
      },
      message: {
        de: `+${diff.toFixed(1)}% KFA seit letzter Messung. Ernährung und Training prüfen.`,
        en: `+${diff.toFixed(1)}% body fat since last measurement. Review diet and training.`,
      },
      priority: 25,
    });
  }

  return results;
}

// ── Hydration ───────────────────────────────────────────────────────────

function hydrationInsights(input: InsightInput): Insight[] {
  const results: Insight[] = [];
  const { waterGlasses, waterGoal } = input;

  if (waterGoal <= 0) return results;

  const pct = Math.round((waterGlasses / waterGoal) * 100);

  // Only show late in the day or if very low
  const hour = new Date().getHours();

  if (hour >= 15 && pct < 40) {
    results.push({
      id: 'water_low',
      category: 'hydration',
      severity: 'warning',
      icon: '💧',
      title: {
        de: 'Zu wenig getrunken',
        en: 'Low hydration',
      },
      message: {
        de: `Erst ${waterGlasses} von ${waterGoal} Gläsern (${pct}%). ${input.workoutCountToday > 0 ? 'Nach dem Training besonders wichtig!' : 'Denk ans Trinken!'}`,
        en: `Only ${waterGlasses} of ${waterGoal} glasses (${pct}%). ${input.workoutCountToday > 0 ? 'Especially important after training!' : 'Remember to drink!'}`,
      },
      priority: 22,
    });
  } else if (pct >= 100) {
    results.push({
      id: 'water_done',
      category: 'hydration',
      severity: 'success',
      icon: '💧',
      title: {
        de: 'Wasserziel erreicht',
        en: 'Water goal reached',
      },
      message: {
        de: `${waterGlasses} Gläser — Tagesziel geschafft!`,
        en: `${waterGlasses} glasses — daily goal achieved!`,
      },
      priority: 55,
    });
  }

  return results;
}

// ── Missing Data ────────────────────────────────────────────────────────

function missingDataInsights(input: InsightInput): Insight[] {
  const results: Insight[] = [];

  if (!input.hasProfile) {
    results.push({
      id: 'no_profile',
      category: 'no_data',
      severity: 'info',
      icon: '👤',
      title: {
        de: 'Profil unvollständig',
        en: 'Incomplete profile',
      },
      message: {
        de: 'Füll dein Profil aus für personalisierte Empfehlungen (BMR, TDEE, Protein).',
        en: 'Complete your profile for personalized recommendations (BMR, TDEE, protein).',
      },
      priority: 60,
    });
  }

  if (input.bpLogs.length === 0 && input.hasSubstances) {
    results.push({
      id: 'no_bp_with_subs',
      category: 'no_data',
      severity: 'warning',
      icon: '❤️',
      title: {
        de: 'Blutdruck nicht gemessen',
        en: 'No blood pressure data',
      },
      message: {
        de: 'Bei aktiver Substanzeinnahme ist regelmäßige Blutdruckkontrolle wichtig!',
        en: 'Regular blood pressure monitoring is important with active substance use!',
      },
      priority: 8,
    });
  }

  return results;
}
