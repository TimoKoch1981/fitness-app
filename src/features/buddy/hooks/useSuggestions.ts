/**
 * Proactive Suggestion Engine — rule-based, no LLM needed.
 *
 * Generates context-aware suggestion chips based on:
 * - Time of day (morning, noon, evening)
 * - Missing data (no weight in 7 days, low protein, etc.)
 * - Active reminders and scheduled tasks
 * - Training plan (is today a training day?)
 *
 * Returns 2-4 short, actionable suggestions the user can tap.
 */

import { useMemo } from 'react';
import type { UserProfile, DailyStats, BodyMeasurement, TrainingPlan } from '../../../types/health';

export interface Suggestion {
  id: string;
  text: string;
  /** The message to send to the buddy when tapped */
  message: string;
  /** Priority: higher = shown first */
  priority: number;
}

interface UseSuggestionsOptions {
  profile?: UserProfile | null;
  dailyStats?: DailyStats;
  latestBody?: BodyMeasurement | null;
  activePlan?: TrainingPlan | null;
  language: 'de' | 'en';
}

export function useSuggestions({
  profile,
  dailyStats,
  latestBody,
  activePlan,
  language,
}: UseSuggestionsOptions): Suggestion[] {
  return useMemo(() => {
    const suggestions: Suggestion[] = [];
    const hour = new Date().getHours();
    const de = language === 'de';

    // ── Time-based suggestions ──

    if (hour >= 6 && hour < 10) {
      suggestions.push({
        id: 'breakfast',
        text: de ? 'Was hast du gefruehstueckt?' : 'What did you have for breakfast?',
        message: de ? 'Was hast du gefrühstückt?' : 'What did you have for breakfast?',
        priority: 80,
      });
    }

    if (hour >= 11 && hour < 14) {
      suggestions.push({
        id: 'lunch',
        text: de ? 'Was gabs zu Mittag?' : "What's for lunch?",
        message: de ? 'Was gab es zum Mittag?' : 'What did you have for lunch?',
        priority: 80,
      });
    }

    if (hour >= 17 && hour < 21) {
      suggestions.push({
        id: 'dinner',
        text: de ? 'Was gabs zum Abendessen?' : "What's for dinner?",
        message: de ? 'Was gab es zum Abendessen?' : 'What did you have for dinner?',
        priority: 75,
      });
    }

    if (hour >= 20 && hour < 24) {
      suggestions.push({
        id: 'day_eval',
        text: de ? 'Wie war mein Tag?' : 'How was my day?',
        message: de ? 'Bewerte meinen heutigen Tag' : 'Evaluate my day today',
        priority: 70,
      });
    }

    // ── Protein check ──

    if (dailyStats && profile) {
      const proteinGoal = profile.daily_protein_goal ?? 150;
      const proteinPct = dailyStats.protein / proteinGoal;

      if (proteinPct < 0.5 && hour >= 14) {
        const remaining = Math.round(proteinGoal - dailyStats.protein);
        suggestions.push({
          id: 'protein_low',
          text: de ? `Noch ${remaining}g Protein offen` : `${remaining}g protein remaining`,
          message: de
            ? `Mir fehlen noch ${remaining}g Protein. Was kann ich noch essen?`
            : `I still need ${remaining}g of protein. What should I eat?`,
          priority: 90,
        });
      }
    }

    // ── Weight tracking ──

    if (latestBody) {
      const daysSinceWeight = Math.floor(
        (Date.now() - new Date(latestBody.date).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceWeight >= 7) {
        suggestions.push({
          id: 'weigh_in',
          text: de ? 'Mal wieder wiegen?' : 'Time to weigh in?',
          message: de ? 'Ich wiege heute X kg' : 'I weigh X kg today',
          priority: 60,
        });
      }
    } else {
      // No body measurements at all
      suggestions.push({
        id: 'first_weigh',
        text: de ? 'Gewicht erfassen' : 'Log your weight',
        message: de ? 'Ich wiege aktuell X kg' : 'I currently weigh X kg',
        priority: 65,
      });
    }

    // ── Training plan check ──

    if (activePlan) {
      const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon, ...
      // Simple: if plan has a day matching today's weekday number
      const todayDay = activePlan.days?.find(d => {
        // Plan days are 1-indexed (day 1 = Monday)
        // Map: Mon=1,Tue=2,...,Sun=7
        const planDayOfWeek = d.day_number === 7 ? 0 : d.day_number;
        return planDayOfWeek === dayOfWeek;
      });
      if (todayDay) {
        suggestions.push({
          id: 'training_today',
          text: de ? `Heute: ${todayDay.name}` : `Today: ${todayDay.name}`,
          message: de
            ? `Heute steht ${todayDay.name} an. Was muss ich beachten?`
            : `Today is ${todayDay.name}. What should I keep in mind?`,
          priority: 85,
        });
      }
    }

    // ── Blood pressure reminder (if user has profile and it's morning) ──

    if (hour >= 7 && hour < 10 && profile) {
      suggestions.push({
        id: 'bp_morning',
        text: de ? 'Blutdruck messen' : 'Check blood pressure',
        message: de ? 'Mein Blutdruck heute morgen war X/Y' : 'My blood pressure this morning was X/Y',
        priority: 50,
      });
    }

    // Sort by priority (highest first) and limit to 4
    return suggestions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 4);
  }, [profile, dailyStats, latestBody, activePlan, language]);
}
