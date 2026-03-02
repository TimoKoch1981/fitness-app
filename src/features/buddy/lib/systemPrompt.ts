/**
 * System prompt for the FitBuddy AI assistant.
 * Injects health context so the LLM can give personalized advice.
 *
 * @deprecated Use the multi-agent system instead (lib/ai/agents/).
 * Each agent now builds its own specialized prompt from versioned skills.
 * This file is kept as an emergency fallback only.
 *
 * @see lib/ai/agents/baseAgent.ts — new prompt assembly
 * @see lib/ai/skills/ — versioned knowledge base
 */

import type { HealthContext } from '../../../types/health';

/**
 * Build the system prompt with current health data context.
 * @deprecated Replaced by agent-specific prompt building in baseAgent.ts
 */
export function buildSystemPrompt(context?: Partial<HealthContext>, language: string = 'de'): string {
  const lang = language === 'de' ? 'Deutsch' : 'English';

  let prompt = language === 'de'
    ? `Du bist FitBuddy, ein freundlicher und kompetenter Fitness- und Gesundheitsassistent.
Du antwortest immer auf ${lang}.
Du bist gleichzeitig Personal Trainer, Ernährungsberater und Gesundheitscoach.
Du bist urteilsfrei — wenn der Nutzer Substanzen wie Testosteron oder PEDs nimmt, berätst du sachlich und schadensminimiered.

Deine Aufgaben:
- Fragen zu Ernährung, Training und Gesundheit beantworten
- Beim Tracken helfen: Wenn der Nutzer sagt was er gegessen/trainiert hat, fasse es zusammen
- Personalisierte Tipps geben basierend auf den aktuellen Daten
- Kurz und prägnant antworten (max 2-3 Sätze, wenn nicht anders gefragt)
- Nährwerte schätzen wenn gefragt (mit Hinweis dass es Schätzungen sind)`
    : `You are FitBuddy, a friendly and knowledgeable fitness and health assistant.
You always respond in ${lang}.
You are a personal trainer, nutritionist, and health coach rolled into one.
You are judgment-free — if the user takes substances like testosterone or PEDs, you advise factually and harm-reducing.

Your tasks:
- Answer questions about nutrition, training, and health
- Help with tracking: When the user tells you what they ate/trained, summarize it
- Give personalized tips based on current data
- Keep responses short and concise (max 2-3 sentences unless asked otherwise)
- Estimate nutritional values when asked (noting they are estimates)`;

  // Inject health context if available
  if (context) {
    prompt += '\n\n--- AKTUELLE NUTZERDATEN ---\n';

    if (context.profile) {
      const p = context.profile;
      prompt += `Profil: ${p.display_name ?? 'Nutzer'}`;
      if (p.height_cm) prompt += `, ${p.height_cm}cm`;
      if (p.gender) prompt += `, ${p.gender}`;
      prompt += `\nTagesziele: ${p.daily_calories_goal} kcal, ${p.daily_protein_goal}g Protein, ${p.daily_water_goal} Gläser Wasser\n`;
    }

    if (context.dailyStats) {
      const s = context.dailyStats;
      prompt += `Heute: ${s.calories}/${s.caloriesGoal} kcal, ${s.protein}/${s.proteinGoal}g Protein, ${s.water}/${s.waterGoal} Gläser Wasser\n`;
    }

    if (context.latestBodyMeasurement) {
      const b = context.latestBodyMeasurement;
      prompt += `Letzte Körperwerte: ${b.weight_kg ?? '?'} kg`;
      if (b.body_fat_pct) prompt += `, ${b.body_fat_pct}% KFA`;
      prompt += '\n';
    }

    if (context.activeSubstances && context.activeSubstances.length > 0) {
      prompt += `Aktive Substanzen: ${context.activeSubstances.map(s => `${s.name} (${s.dosage ?? '?'} ${s.unit ?? ''}, ${s.frequency ?? ''})`).join(', ')}\n`;
    }

    if (context.recentWorkouts && context.recentWorkouts.length > 0) {
      prompt += `Letzte Trainings: ${context.recentWorkouts.slice(0, 3).map(w => `${w.name} (${w.type})`).join(', ')}\n`;
    }

    prompt += '--- ENDE NUTZERDATEN ---';
  }

  return prompt;
}
