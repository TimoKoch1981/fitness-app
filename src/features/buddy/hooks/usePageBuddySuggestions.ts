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

      // ── Tracking: Body ──
      case 'tracking_body':
        return [
          {
            id: 'body_analyze',
            label: de ? 'Körper analysieren' : 'Analyze Body',
            message: de
              ? 'Wie hat sich mein Gewicht und Körperfett entwickelt?'
              : 'How has my weight and body fat developed?',
            icon: '📊',
            targetAgent: 'analysis' as AgentType,
          },
          {
            id: 'body_recomp',
            label: de ? 'Recomp-Tipps' : 'Recomp Tips',
            message: de
              ? 'Gib mir Tipps für Body Recomposition basierend auf meinen Daten.'
              : 'Give me body recomposition tips based on my data.',
            icon: '💪',
            targetAgent: 'nutrition' as AgentType,
          },
        ];

      // ── Medical ──
      case 'medical':
        return [
          {
            id: 'medical_bp',
            label: de ? 'Blutdruck bewerten' : 'Evaluate BP',
            message: de
              ? 'Bewerte meine Blutdruckwerte der letzten Wochen.'
              : 'Evaluate my blood pressure values from the last weeks.',
            icon: '❤️',
            targetAgent: 'analysis' as AgentType,
          },
          {
            id: 'medical_substances',
            label: de ? 'Substanzen-Check' : 'Substance Check',
            message: de
              ? 'Überprüfe meine aktuellen Substanzen und mögliche Wechselwirkungen.'
              : 'Check my current substances and possible interactions.',
            icon: '💊',
            targetAgent: 'substance' as AgentType,
          },
          {
            id: 'medical_health',
            label: de ? 'Gesundheits-Check' : 'Health Check',
            message: de
              ? 'Wie ist mein allgemeiner Gesundheitsstatus basierend auf meinen Daten?'
              : 'How is my overall health status based on my data?',
            icon: '🩺',
            targetAgent: 'analysis' as AgentType,
          },
        ];

      // ── Cockpit ──
      case 'cockpit':
        return [
          {
            id: 'cockpit_status',
            label: de ? 'Tagesstatus' : 'Daily Status',
            message: de
              ? 'Wie sieht mein heutiger Tag aus? Gib mir einen Überblick.'
              : 'How does my day look? Give me an overview.',
            icon: '📋',
            targetAgent: 'analysis' as AgentType,
          },
          {
            id: 'cockpit_week',
            label: de ? 'Wochenreport' : 'Weekly Report',
            message: de
              ? 'Erstelle mir einen Wochenreport über Training und Ernährung.'
              : 'Create a weekly report on training and nutrition.',
            icon: '📈',
            targetAgent: 'analysis' as AgentType,
          },
          {
            id: 'cockpit_recommend',
            label: de ? 'Empfehlung' : 'Recommendation',
            message: de
              ? 'Was empfiehlst du mir heute zu tun?'
              : 'What do you recommend I do today?',
            icon: '💡',
            targetAgent: 'analysis' as AgentType,
          },
        ];

            default:
        return [];
    }
  }, [pageId, language]);
}
