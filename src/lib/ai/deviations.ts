/**
 * Deviations Engine — Analyzes user data for anomalies and triggers proactive agent behavior.
 *
 * Checks daily data against baselines and thresholds.
 * Returns structured deviations that are:
 * 1. Injected into agent system prompts as context
 * 2. Used to generate context-sensitive suggestion chips
 *
 * Rules:
 * - Calorie deficit >50% after noon → nutrition agent warns
 * - Blood pressure >160/100 → medical agent warns
 * - Energy <3 + training planned → training agent suggests lighter workout
 * - Illness reported → all agents informed
 * - No training for >3 days → training agent nudges
 * - Protein <60% of goal with calories >70% → nutrition agent warns
 */

import type { HealthContext, DailyCheckin, SessionFeedback } from '../../types/health';

export type DeviationType = 'warning' | 'info' | 'suggestion';
export type AgentType = 'training' | 'nutrition' | 'medical' | 'general' | 'substance';

export interface Deviation {
  type: DeviationType;
  agent: AgentType;
  message: string;
  messageEN: string;
  priority: number; // 1 = highest, 5 = lowest
  icon: string;
}

/**
 * Analyze current user data for deviations and anomalies.
 * Returns ordered list of deviations (highest priority first).
 */
export function analyzeDeviations(
  context: Partial<HealthContext>,
  checkin?: DailyCheckin | null,
): Deviation[] {
  const deviations: Deviation[] = [];
  const now = new Date();
  const hour = now.getHours();

  // ── Check-in based deviations ──────────────────────────────────────────

  if (checkin) {
    // Illness → all agents
    if (checkin.illness) {
      deviations.push({
        type: 'warning',
        agent: 'training',
        message: 'User meldet Krankheit — Training pausieren, Erholung priorisieren',
        messageEN: 'User reports illness — pause training, prioritize recovery',
        priority: 1,
        icon: '🤒',
      });
      deviations.push({
        type: 'info',
        agent: 'nutrition',
        message: 'User ist krank — leicht verdauliche, naehrende Kost empfehlen',
        messageEN: 'User is sick — recommend easily digestible, nourishing food',
        priority: 2,
        icon: '🤒',
      });
    }

    // Low energy (1-2) + training plan exists → lighter workout
    if (checkin.energy_level && checkin.energy_level <= 2 && context.activePlan) {
      deviations.push({
        type: 'suggestion',
        agent: 'training',
        message: 'Energielevel niedrig (${checkin.energy_level}/5) — Intensitaet reduzieren oder Ruhetag empfehlen',
        messageEN: `Low energy level (${checkin.energy_level}/5) — suggest reduced intensity or rest day`,
        priority: 2,
        icon: '😴',
      });
    }

    // Poor sleep (1-2) → training impact
    if (checkin.sleep_quality && checkin.sleep_quality <= 2) {
      deviations.push({
        type: 'info',
        agent: 'training',
        message: `Schlafqualitaet schlecht (${checkin.sleep_quality}/5) — Regeneration beeintraechtigt, Volumen ggf. reduzieren`,
        messageEN: `Poor sleep quality (${checkin.sleep_quality}/5) — recovery impaired, consider reducing volume`,
        priority: 3,
        icon: '😴',
      });
    }

    // High stress (4-5) → cortisol impact
    if (checkin.stress_level && checkin.stress_level >= 4) {
      deviations.push({
        type: 'info',
        agent: 'training',
        message: `Hoher Stress (${checkin.stress_level}/5) — Cortisol erhoet, leichteres Training oder Deload empfehlen`,
        messageEN: `High stress (${checkin.stress_level}/5) — elevated cortisol, recommend lighter training or deload`,
        priority: 3,
        icon: '😰',
      });
    }

    // Pain areas → specific muscle warnings
    if (checkin.pain_areas && checkin.pain_areas.length > 0) {
      deviations.push({
        type: 'warning',
        agent: 'training',
        message: `Schmerzen gemeldet: ${checkin.pain_areas.join(', ')} — betroffene Bereiche schonen`,
        messageEN: `Pain reported: ${checkin.pain_areas.join(', ')} — protect affected areas`,
        priority: 2,
        icon: '⚠️',
      });
      deviations.push({
        type: 'info',
        agent: 'medical',
        message: `Schmerzen: ${checkin.pain_areas.join(', ')} — bei anhaltenden Schmerzen Arzt empfehlen`,
        messageEN: `Pain: ${checkin.pain_areas.join(', ')} — recommend doctor for persistent pain`,
        priority: 3,
        icon: '⚠️',
      });
    }
  }

  // ── Nutrition deviations ──────────────────────────────────────────────

  if (context.dailyStats) {
    const stats = context.dailyStats;
    const calGoal = stats.caloriesGoal ?? 2000;
    const protGoal = stats.proteinGoal ?? 150;

    // After noon: calorie intake <50% of goal
    if (hour >= 14 && stats.calories < calGoal * 0.5) {
      deviations.push({
        type: 'suggestion',
        agent: 'nutrition',
        message: `Kalorienaufnahme nur ${stats.calories}/${calGoal} kcal (${Math.round(stats.calories / calGoal * 100)}%) um ${hour} Uhr — nachfragen ob alles OK`,
        messageEN: `Calorie intake only ${stats.calories}/${calGoal} kcal (${Math.round(stats.calories / calGoal * 100)}%) at ${hour}:00 — check if everything is OK`,
        priority: 3,
        icon: '🍽️',
      });
    }

    // Critical undereating: <1200 kcal logged AND past noon (to avoid false alarms in AM)
    if (hour >= 18 && stats.calories > 0 && stats.calories < 1200) {
      deviations.push({
        type: 'warning',
        agent: 'nutrition',
        message: `Kalorienaufnahme kritisch niedrig: nur ${stats.calories} kcal — unter 1200 kcal erhoet RED-S-Risiko`,
        messageEN: `Calorie intake critically low: only ${stats.calories} kcal — under 1200 kcal increases RED-S risk`,
        priority: 1,
        icon: '🚨',
      });
    }

    // Severe calorie deficit: >1000 kcal below goal
    if (stats.calories > 0 && calGoal - stats.calories > 1000) {
      deviations.push({
        type: 'warning',
        agent: 'nutrition',
        message: `Kaloriendefizit ueber 1000 kcal: ${calGoal - stats.calories} kcal Defizit — Unterernaehrungsrisiko`,
        messageEN: `Calorie deficit over 1000 kcal: ${calGoal - stats.calories} kcal deficit — undereating risk`,
        priority: 2,
        icon: '⚠️',
      });
    }

    // Protein <60% but calories >70% → protein warning
    if (stats.calories > calGoal * 0.7 && stats.protein < protGoal * 0.6) {
      deviations.push({
        type: 'warning',
        agent: 'nutrition',
        message: `Protein zu niedrig: ${stats.protein}g / ${protGoal}g (${Math.round(stats.protein / protGoal * 100)}%) bei ${Math.round(stats.calories / calGoal * 100)}% Kalorien`,
        messageEN: `Protein too low: ${stats.protein}g / ${protGoal}g (${Math.round(stats.protein / protGoal * 100)}%) at ${Math.round(stats.calories / calGoal * 100)}% calories`,
        priority: 2,
        icon: '⚠️',
      });
    }
  }

  // ── Blood pressure deviations ─────────────────────────────────────────

  if (context.recentBloodPressure && context.recentBloodPressure.length > 0) {
    const latest = context.recentBloodPressure[0];

    // Hypertensive crisis
    if (latest.systolic >= 180 || latest.diastolic >= 120) {
      deviations.push({
        type: 'warning',
        agent: 'medical',
        message: `BLUTDRUCK KRITISCH: ${latest.systolic}/${latest.diastolic} mmHg — sofort Arzt/Notarzt!`,
        messageEN: `BLOOD PRESSURE CRITICAL: ${latest.systolic}/${latest.diastolic} mmHg — seek immediate medical attention!`,
        priority: 1,
        icon: '🚨',
      });
    }
    // Hypertension Grade 2+
    else if (latest.systolic >= 160 || latest.diastolic >= 100) {
      deviations.push({
        type: 'warning',
        agent: 'medical',
        message: `Blutdruck erhoet: ${latest.systolic}/${latest.diastolic} mmHg — Arzt konsultieren, kein schweres Training`,
        messageEN: `Blood pressure elevated: ${latest.systolic}/${latest.diastolic} mmHg — consult doctor, no heavy training`,
        priority: 1,
        icon: '🔴',
      });
      deviations.push({
        type: 'warning',
        agent: 'training',
        message: `Blutdruck ${latest.systolic}/${latest.diastolic} — kein schweres Pressen, Valsalva vermeiden`,
        messageEN: `Blood pressure ${latest.systolic}/${latest.diastolic} — no heavy pressing, avoid Valsalva`,
        priority: 2,
        icon: '🔴',
      });
    }
    // High normal (130-139/85-89)
    else if (latest.systolic >= 130 || latest.diastolic >= 85) {
      deviations.push({
        type: 'info',
        agent: 'medical',
        message: `Blutdruck hochnormal: ${latest.systolic}/${latest.diastolic} mmHg — regelmaessig messen`,
        messageEN: `Blood pressure high-normal: ${latest.systolic}/${latest.diastolic} mmHg — measure regularly`,
        priority: 4,
        icon: '🟡',
      });
    }
  }

  // ── Training deviations ───────────────────────────────────────────────

  if (context.recentWorkouts) {
    const workouts = context.recentWorkouts;
    if (workouts.length > 0) {
      const lastDate = new Date(workouts[0].date);
      const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      // No training for 3+ days
      if (daysSince >= 3 && !checkin?.illness) {
        deviations.push({
          type: 'suggestion',
          agent: 'training',
          message: `Letztes Training vor ${daysSince} Tagen — sanfter Hinweis auf Trainingsplan`,
          messageEN: `Last training ${daysSince} days ago — gentle reminder about training plan`,
          priority: 4,
          icon: '💪',
        });
      }

      // Overtraining detection: 7+ workouts in last 7 days
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const workoutsLast7Days = workouts.filter(
        w => new Date(w.date).getTime() >= sevenDaysAgo
      ).length;

      if (workoutsLast7Days >= 7) {
        const isHighStress = checkin?.stress_level && checkin.stress_level >= 4;
        const isLowEnergy = checkin?.energy_level && checkin.energy_level <= 2;
        const isPoorSleep = checkin?.sleep_quality && checkin.sleep_quality <= 2;

        deviations.push({
          type: 'warning',
          agent: 'training',
          message: `Uebertrainings-Risiko: ${workoutsLast7Days} Einheiten in 7 Tagen${isLowEnergy ? ' + niedrige Energie' : ''}${isPoorSleep ? ' + schlechter Schlaf' : ''}${isHighStress ? ' + hoher Stress' : ''} — Ruhetag oder Deload empfehlen`,
          messageEN: `Overtraining risk: ${workoutsLast7Days} sessions in 7 days${isLowEnergy ? ' + low energy' : ''}${isPoorSleep ? ' + poor sleep' : ''}${isHighStress ? ' + high stress' : ''} — recommend rest day or deload`,
          priority: 2,
          icon: '🔥',
        });
      }
    }

    // ── Training-specific Early Triggers (KI-Trainer Block C) ──────────

    // Access SessionFeedback from recent workouts
    const recentFeedbacks = workouts
      .filter(w => w.session_feedback != null)
      .map(w => w.session_feedback as SessionFeedback);

    const reviewTriggers = context.activePlan?.review_config?.review_triggers;

    // 1. Plateau Detection: plateau_exercises found in latest session
    if (recentFeedbacks.length > 0) {
      const latestAuto = recentFeedbacks[0]?.auto_calculated;
      const plateauExercises = latestAuto?.plateau_exercises ?? [];
      const plateauThreshold = reviewTriggers?.plateau_sessions ?? 3;
      if (plateauExercises.length > 0) {
        deviations.push({
          type: 'info',
          agent: 'training',
          message: `Plateau erkannt: ${plateauExercises.slice(0, 3).join(', ')} — gleiches Gewicht seit ${plateauThreshold}+ Sessions. Variante oder Progression empfehlen.`,
          messageEN: `Plateau detected: ${plateauExercises.slice(0, 3).join(', ')} — same weight for ${plateauThreshold}+ sessions. Suggest variation or progression.`,
          priority: 3,
          icon: '📊',
        });
      }

      // 2. Low Completion Rate (<70%)
      const latestCompletion = recentFeedbacks[0]?.completion_rate;
      if (latestCompletion != null && latestCompletion < 0.7) {
        deviations.push({
          type: 'warning',
          agent: 'training',
          message: `Niedrige Abschlussrate: ${Math.round(latestCompletion * 100)}% — Plan ueberpruefen, ggf. Volumen reduzieren.`,
          messageEN: `Low completion rate: ${Math.round(latestCompletion * 100)}% — review plan, consider reducing volume.`,
          priority: 2,
          icon: '⚠️',
        });
      }

      // 3. Joint Pain (rating >= threshold)
      const painThreshold = reviewTriggers?.joint_pain_threshold ?? 3;
      const latestPainRating = recentFeedbacks[0]?.joint_pain_rating;
      const latestPainAreas = recentFeedbacks[0]?.joint_pain ?? [];
      if (latestPainRating != null && latestPainRating >= painThreshold && latestPainAreas.length > 0) {
        deviations.push({
          type: 'warning',
          agent: 'training',
          message: `Gelenkschmerzen gemeldet: ${latestPainAreas.join(', ')} (Stufe ${latestPainRating}/5) — belastende Uebungen anpassen.`,
          messageEN: `Joint pain reported: ${latestPainAreas.join(', ')} (level ${latestPainRating}/5) — adjust stressful exercises.`,
          priority: 2,
          icon: '🦴',
        });
      }

      // 4. RPE Drift (feeling harder at same weights)
      const rpeDriftExercises = latestAuto?.rpe_drift_exercises ?? [];
      if (rpeDriftExercises.length > 0) {
        deviations.push({
          type: 'info',
          agent: 'training',
          message: `RPE-Drift erkannt: ${rpeDriftExercises.slice(0, 3).join(', ')} — gleiche Last fuehlt sich schwerer an. Erholung pruefen.`,
          messageEN: `RPE drift detected: ${rpeDriftExercises.slice(0, 3).join(', ')} — same load feels harder. Check recovery.`,
          priority: 3,
          icon: '📈',
        });
      }
    }

    // 5. Sleep Deficit: 5+ days with <6h sleep
    if (context.recentSleepLogs && context.recentSleepLogs.length >= 5) {
      const sleepThresholdDays = reviewTriggers?.sleep_days_threshold ?? 5;
      const shortSleepDays = context.recentSleepLogs
        .slice(0, 7) // Last 7 days
        .filter(log => log.duration_minutes != null && log.duration_minutes < 360)
        .length;

      if (shortSleepDays >= sleepThresholdDays) {
        deviations.push({
          type: 'warning',
          agent: 'training',
          message: `Schlafdefizit: ${shortSleepDays} von 7 Tagen unter 6 Stunden — Regeneration beeintraechtigt, Volumen anpassen.`,
          messageEN: `Sleep deficit: ${shortSleepDays} of 7 days under 6 hours — recovery impaired, adjust volume.`,
          priority: 2,
          icon: '😴',
        });
      }
    }

    // 6. Missed Sessions: >30% of planned sessions missed
    if (context.activePlan && workouts.length >= 2) {
      const missedPctThreshold = reviewTriggers?.missed_sessions_pct ?? 30;
      const planDays = context.activePlan.days?.length ?? 0;
      if (planDays > 0) {
        // Count workouts in last 14 days vs expected
        const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
        const workoutsLast14 = workouts.filter(
          w => new Date(w.date).getTime() >= fourteenDaysAgo
        ).length;
        const expectedSessions = planDays * 2; // 2 weeks worth
        const completionPct = expectedSessions > 0 ? (workoutsLast14 / expectedSessions) * 100 : 100;

        if (completionPct < (100 - missedPctThreshold)) {
          deviations.push({
            type: 'info',
            agent: 'training',
            message: `Trainingsplanung: ${workoutsLast14}/${expectedSessions} Sessions in 14 Tagen (${Math.round(completionPct)}%). Plan anpassen oder Motivation besprechen.`,
            messageEN: `Training adherence: ${workoutsLast14}/${expectedSessions} sessions in 14 days (${Math.round(completionPct)}%). Adjust plan or discuss motivation.`,
            priority: 3,
            icon: '📅',
          });
        }
      }
    }
  }

  // ── Blood work deviations (Power+ mode) ─────────────────────────────

  if (context.latestBloodWork) {
    const bw = context.latestBloodWork;

    // Low HDL (<25 mg/dL) — cardiovascular risk, common with AAS
    if (bw.hdl !== undefined && bw.hdl !== null && bw.hdl < 25) {
      deviations.push({
        type: 'warning',
        agent: 'medical',
        message: `HDL kritisch niedrig: ${bw.hdl} mg/dL (<25) — erhoehtes kardiovaskulaeres Risiko. Kardiologische Kontrolle empfohlen.`,
        messageEN: `HDL critically low: ${bw.hdl} mg/dL (<25) — elevated cardiovascular risk. Cardiological check recommended.`,
        priority: 1,
        icon: '🫀',
      });
    } else if (bw.hdl !== undefined && bw.hdl !== null && bw.hdl < 40) {
      deviations.push({
        type: 'info',
        agent: 'medical',
        message: `HDL niedrig: ${bw.hdl} mg/dL (<40) — Ziel: >40 mg/dL. Omega-3, Cardio, ggf. Substanz-Pause erwaegen.`,
        messageEN: `HDL low: ${bw.hdl} mg/dL (<40) — target: >40 mg/dL. Consider omega-3, cardio, or substance break.`,
        priority: 3,
        icon: '🫀',
      });
    }

    // Elevated hematocrit (≥52%) — thrombosis risk with AAS/TRT
    if (bw.hematocrit !== undefined && bw.hematocrit !== null && bw.hematocrit >= 54) {
      deviations.push({
        type: 'warning',
        agent: 'medical',
        message: `Haematokrit GEFAEHRLICH: ${bw.hematocrit}% (>=54%) — Phlebotomie erwaegen, Arzt aufsuchen!`,
        messageEN: `Hematocrit DANGEROUS: ${bw.hematocrit}% (>=54%) — consider phlebotomy, see doctor!`,
        priority: 1,
        icon: '🩸',
      });
    } else if (bw.hematocrit !== undefined && bw.hematocrit !== null && bw.hematocrit >= 52) {
      deviations.push({
        type: 'warning',
        agent: 'medical',
        message: `Haematokrit erhoet: ${bw.hematocrit}% (>=52%) — Polyzythaemie-Risiko, regelmaessig kontrollieren.`,
        messageEN: `Hematocrit elevated: ${bw.hematocrit}% (>=52%) — polycythemia risk, monitor regularly.`,
        priority: 2,
        icon: '🩸',
      });
    }

    // Elevated liver values (ALT/AST >3x upper normal)
    if (bw.alt !== undefined && bw.alt !== null && bw.alt > 150) {
      deviations.push({
        type: 'warning',
        agent: 'medical',
        message: `Leberwert ALT stark erhoet: ${bw.alt} U/L (>150) — hepatotoxische Substanzen ggf. absetzen, Arzt konsultieren.`,
        messageEN: `Liver ALT severely elevated: ${bw.alt} U/L (>150) — consider stopping hepatotoxic substances, consult doctor.`,
        priority: 1,
        icon: '🔬',
      });
    }
  }

  // Sort by priority (ascending = highest priority first)
  return deviations.sort((a, b) => a.priority - b.priority);
}

/**
 * Format deviations as a markdown block for injection into agent system prompts.
 * Only includes deviations relevant to the specified agent.
 */
export function formatDeviationsForAgent(
  deviations: Deviation[],
  agentType: string,
  language: string = 'de',
): string {
  const relevant = deviations.filter(
    d => d.agent === agentType || d.agent === 'general',
  );

  if (relevant.length === 0) return '';

  const de = language === 'de';
  let block = de
    ? `\n## ⚠️ AKTUELLE HINWEISE (automatisch erkannt)\n`
    : `\n## ⚠️ CURRENT ALERTS (automatically detected)\n`;

  block += de
    ? `> Reagiere proaktiv auf diese Abweichungen in deiner Antwort.\n\n`
    : `> React proactively to these deviations in your response.\n\n`;

  for (const d of relevant) {
    const msg = de ? d.message : d.messageEN;
    const typeLabel = d.type === 'warning' ? '⚠️ WARNUNG' : d.type === 'info' ? 'ℹ️ INFO' : '💡 TIPP';
    block += `- ${typeLabel}: ${d.icon} ${msg}\n`;
  }

  return block;
}

/**
 * Generate context-sensitive suggestion chips based on current deviations.
 */
export function getDeviationSuggestions(
  deviations: Deviation[],
  language: string = 'de',
): Array<{ id: string; label: string; message: string; icon: string }> {
  const suggestions: Array<{ id: string; label: string; message: string; icon: string }> = [];
  const de = language === 'de';

  // Map high-priority deviations to actionable chips
  // Note: message checks use lowercase to avoid case-sensitivity bugs
  for (const d of deviations.slice(0, 3)) { // Max 3 chips
    const msgLower = d.message.toLowerCase();
    if (d.agent === 'training' && d.type === 'warning' && msgLower.includes('krank')) {
      suggestions.push({
        id: 'dev_illness',
        label: de ? 'Training bei Krankheit?' : 'Training while sick?',
        message: de ? 'Ich bin krank. Soll ich trotzdem trainieren?' : 'I\'m sick. Should I still train?',
        icon: '🤒',
      });
    } else if (d.agent === 'training' && msgLower.includes('energie')) {
      suggestions.push({
        id: 'dev_low_energy',
        label: de ? 'Leichtes Training' : 'Light workout',
        message: de ? 'Mir fehlt heute Energie. Gib mir ein leichtes Workout.' : 'I\'m low on energy today. Give me a light workout.',
        icon: '😴',
      });
    } else if (d.agent === 'nutrition' && msgLower.includes('protein')) {
      suggestions.push({
        id: 'dev_protein',
        label: de ? 'Protein auffüllen' : 'Boost protein',
        message: de ? 'Wie kann ich heute noch mein Protein erreichen?' : 'How can I still hit my protein target today?',
        icon: '💪',
      });
    } else if (d.agent === 'medical' && msgLower.includes('blutdruck')) {
      suggestions.push({
        id: 'dev_bp',
        label: de ? 'Blutdruck besprechen' : 'Discuss BP',
        message: de ? 'Mein Blutdruck war hoch. Was bedeutet das?' : 'My blood pressure was high. What does that mean?',
        icon: '❤️',
      });
    } else if (d.agent === 'training' && msgLower.includes('tagen')) {
      suggestions.push({
        id: 'dev_notraining',
        label: de ? 'Training nachholen' : 'Catch up training',
        message: de ? 'Ich habe lange nicht trainiert. Wie steige ich wieder ein?' : 'I haven\'t trained in a while. How do I get back into it?',
        icon: '💪',
      });
    } else if (d.agent === 'nutrition' && msgLower.includes('kritisch niedrig')) {
      suggestions.push({
        id: 'dev_undereating',
        label: de ? 'Unterkalorien!' : 'Undereating!',
        message: de ? 'Ich habe heute sehr wenig gegessen. Ist das gefaehrlich?' : "I've eaten very little today. Is that dangerous?",
        icon: '🚨',
      });
    } else if (d.agent === 'nutrition' && msgLower.includes('defizit ueber 1000')) {
      suggestions.push({
        id: 'dev_deficit',
        label: de ? 'Grosses Defizit' : 'Large deficit',
        message: de ? 'Mein Kaloriendefizit ist sehr gross. Was soll ich tun?' : 'My calorie deficit is very large. What should I do?',
        icon: '⚠️',
      });
    } else if (d.agent === 'nutrition' && msgLower.includes('kalorien')) {
      suggestions.push({
        id: 'dev_calories',
        label: de ? 'Kalorien nachholen' : 'Catch up calories',
        message: de ? 'Ich habe heute noch wenig gegessen. Was schlägst du vor?' : 'I haven\'t eaten much today. What do you suggest?',
        icon: '🍽️',
      });
    } else if (d.agent === 'training' && msgLower.includes('uebertraining')) {
      suggestions.push({
        id: 'dev_overtraining',
        label: de ? 'Übertraining?' : 'Overtraining?',
        message: de ? 'Ich trainiere viel. Bin ich im Übertraining?' : 'I\'ve been training a lot. Am I overtraining?',
        icon: '🔥',
      });
    } else if (d.agent === 'medical' && msgLower.includes('hdl')) {
      suggestions.push({
        id: 'dev_hdl',
        label: de ? 'HDL besprechen' : 'Discuss HDL',
        message: de ? 'Mein HDL ist niedrig. Was kann ich tun?' : 'My HDL is low. What can I do?',
        icon: '🫀',
      });
    } else if (d.agent === 'medical' && msgLower.includes('haematokrit')) {
      suggestions.push({
        id: 'dev_hematocrit',
        label: de ? 'Hämatokrit besprechen' : 'Discuss hematocrit',
        message: de ? 'Mein Hämatokrit ist erhöht. Was bedeutet das?' : 'My hematocrit is elevated. What does it mean?',
        icon: '🩸',
      });
    } else if (d.agent === 'training' && msgLower.includes('plateau')) {
      suggestions.push({
        id: 'dev_plateau',
        label: de ? 'Plateau durchbrechen' : 'Break plateau',
        message: de ? 'Ich stagniere bei einigen Übungen. Was kann ich ändern?' : 'I\'m stalling on some exercises. What can I change?',
        icon: '📊',
      });
    } else if (d.agent === 'training' && msgLower.includes('abschlussrate')) {
      suggestions.push({
        id: 'dev_completion',
        label: de ? 'Plan anpassen' : 'Adjust plan',
        message: de ? 'Ich schaffe nicht alle Übungen. Sollten wir den Plan anpassen?' : 'I can\'t finish all exercises. Should we adjust the plan?',
        icon: '⚠️',
      });
    } else if (d.agent === 'training' && msgLower.includes('gelenkschmerzen')) {
      suggestions.push({
        id: 'dev_joint_pain',
        label: de ? 'Gelenkschmerzen' : 'Joint pain',
        message: de ? 'Ich habe Gelenkschmerzen. Welche Übungen sollte ich anpassen?' : 'I have joint pain. Which exercises should I adjust?',
        icon: '🦴',
      });
    } else if (d.agent === 'training' && msgLower.includes('rpe-drift')) {
      suggestions.push({
        id: 'dev_rpe_drift',
        label: de ? 'Erholung prüfen' : 'Check recovery',
        message: de ? 'Die Gewichte fühlen sich schwerer an. Brauche ich einen Deload?' : 'The weights feel heavier. Do I need a deload?',
        icon: '📈',
      });
    } else if (d.agent === 'training' && msgLower.includes('schlafdefizit')) {
      suggestions.push({
        id: 'dev_sleep_deficit',
        label: de ? 'Schlaf verbessern' : 'Improve sleep',
        message: de ? 'Ich schlafe zu wenig. Wie wirkt sich das auf mein Training aus?' : 'I\'m not sleeping enough. How does this affect my training?',
        icon: '😴',
      });
    } else if (d.agent === 'training' && msgLower.includes('trainingsplanung')) {
      suggestions.push({
        id: 'dev_missed_sessions',
        label: de ? 'Sessions nachholen' : 'Catch up sessions',
        message: de ? 'Ich verpasse zu viele Sessions. Wie kann ich den Plan anpassen?' : 'I\'m missing too many sessions. How can I adjust the plan?',
        icon: '📅',
      });
    }
  }

  return suggestions;
}
