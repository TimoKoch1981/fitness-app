/**
 * Page-Specific Buddy Suggestions — central hook for all pages.
 *
 * Returns 2-3 contextual suggestions per page that navigate to the Buddy
 * with an autoMessage, triggering the appropriate specialist agent via
 * the keyword router.
 *
 * Usage: const suggestions = usePageBuddySuggestions('cockpit', language);
 */

import { useMemo } from 'react';
import type { AgentType } from '../../../lib/ai/agents/types';

export interface BuddySuggestion {
  id: string;
  /** Display label on the chip */
  label: string;
  /** The autoMessage sent to the buddy when tapped */
  message: string;
  /** Optional emoji icon prefix */
  icon?: string;
  /** Target agent thread to open (bypasses keyword router) */
  targetAgent?: AgentType;
}

export type PageId =
  | 'tracking_nutrition'
  | 'tracking_training'
  | 'tracking_training_plan'
  | 'tracking_training_history'
  | 'tracking_training_progress'
  | 'tracking_body'
  | 'medical'
  | 'cockpit';

export function usePageBuddySuggestions(
  pageId: PageId,
  language: string,
): BuddySuggestion[] {
  return useMemo(() => {
    const de = language === 'de';

    switch (pageId) {
      // ── Tracking: Nutrition ──
      case 'tracking_nutrition':
        return [
          {
            id: 'meals_evaluate',
            label: de ? 'Tag auswerten' : 'Evaluate Day',
            message: de
              ? 'Wie sieht mein Tag heute aus? Bewerte meine Ern\u00e4hrung.'
              : 'How does my day look? Evaluate my nutrition.',
            icon: '\ud83d\udcca',
            targetAgent: 'nutrition' as AgentType,
          },
          {
            id: 'meals_suggest',
            label: de ? 'Was soll ich essen?' : 'What should I eat?',
            message: de
              ? 'Was kann ich jetzt noch essen, um meine Makros zu treffen?'
              : 'What should I eat to hit my macros?',
            icon: '\ud83c\udf7d\ufe0f',
            targetAgent: 'nutrition' as AgentType,
          },
          {
            id: 'meals_protein',
            label: de ? 'Protein-Tipps' : 'Protein Tips',
            message: de
              ? 'Gib mir proteinreiche Mahlzeit-Ideen.'
              : 'Give me high-protein meal ideas.',
            icon: '\ud83d\udcaa',
            targetAgent: 'nutrition' as AgentType,
          },
        ];

      // ── Tracking: Training — Today ──
      case 'tracking_training':
        return [
          {
            id: 'workout_advice',
            label: de ? 'Was trainieren?' : 'What to train?',
            message: de
              ? 'Welche \u00dcbungen sind heute dran?'
              : 'Which exercises should I do today?',
            icon: '\ud83d\udca1',
            targetAgent: 'training' as AgentType,
          },
        ];

      case 'tracking_training_plan':
        return [
          {
            id: 'workout_log',
            label: de ? 'Workout loggen' : 'Log Workout',
            message: de
              ? 'Ich m\u00f6chte ein Training loggen. Frag mich bitte was ich trainiert habe, bevor du etwas eintr\u00e4gst.'
              : 'I want to log a workout. Please ask me what I trained before logging anything.',
            icon: '\ud83c\udfcb\ufe0f',
            targetAgent: 'training' as AgentType,
          },
          {
            id: 'plan_create',
            label: de ? 'Neuen Plan' : 'New Plan',
            message: de
              ? 'Erstell mir einen Trainingsplan.'
              : 'Create a training plan for me.',
            icon: '\ud83c\udd95',
            targetAgent: 'training' as AgentType,
          },
          {
            id: 'training_tip',
            label: de ? 'Trainingstipp' : 'Training Tip',
            message: de
              ? 'Gib mir einen Trainingstipp passend zu meinem Plan.'
              : 'Give me a training tip based on my plan.',
            icon: '\ud83d\udca1',
            targetAgent: 'training' as AgentType,
          },
        ];

      case 'tracking_training_history':
        return [
          {
            id: 'history_analyze',
            label: de ? 'Woche analysieren' : 'Analyze Week',
            message: de
              ? 'Analysiere meine Trainingshistorie der letzten Woche.'
              : 'Analyze my training history from last week.',
            icon: '📅',
            targetAgent: 'training' as AgentType,
          },
          {
            id: 'history_compare',
            label: de ? 'Fortschritte zeigen' : 'Show Progress',
            message: de
              ? 'Wie hat sich mein Training in den letzten Wochen entwickelt?'
              : 'How has my training progressed over the last weeks?',
            icon: '📈',
            targetAgent: 'analysis' as AgentType,
          },
        ];

      // ── Tracking: Training — Progress/Analytics ──
      case 'tracking_training_progress':
        return [
          {
            id: 'progress_strength',
            label: de ? 'Kraft analysieren' : 'Analyze Strength',
            message: de
              ? 'Analysiere meine Kraftentwicklung und e1RM-Trends.'
              : 'Analyze my strength development and e1RM trends.',
            icon: '📊',
            targetAgent: 'analysis' as AgentType,
          },
          {
            id: 'progress_weak',
            label: de ? 'Schwachstellen' : 'Weak Points',
            message: de
              ? 'Wo sind meine Schwachstellen im Training? Was sollte ich verbessern?'
              : 'Where are my weak points in training? What should I improve?',
            icon: '🔍',
            targetAgent: 'training' as AgentType,
          },
          {
            id: 'progress_recommendation',
            label: de ? 'Empfehlungen' : 'Recommendations',
            message: de
              ? 'Welche Anpassungen empfiehlst du basierend auf meinen Fortschrittsdaten?'
              : 'What adjustments do you recommend based on my progress data?',
            icon: '💡',
            targetAgent: 'training' as AgentType,
          },
        ];

      default:
        return [];
    }
  }, [pageId, language]);
}
