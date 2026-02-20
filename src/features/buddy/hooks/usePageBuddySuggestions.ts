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

export interface BuddySuggestion {
  id: string;
  /** Display label on the chip */
  label: string;
  /** The autoMessage sent to the buddy when tapped */
  message: string;
  /** Optional emoji icon prefix */
  icon?: string;
}

export type PageId =
  | 'tracking_nutrition'
  | 'tracking_training'
  | 'tracking_training_plan'
  | 'tracking_body'
  | 'medical'
  | 'cockpit';

export function usePageBuddySuggestions(
  pageId: PageId,
  language: 'de' | 'en',
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
          },
          {
            id: 'meals_suggest',
            label: de ? 'Was soll ich essen?' : 'What should I eat?',
            message: de
              ? 'Was kann ich jetzt noch essen, um meine Makros zu treffen?'
              : 'What should I eat to hit my macros?',
            icon: '\ud83c\udf7d\ufe0f',
          },
          {
            id: 'meals_protein',
            label: de ? 'Protein-Tipps' : 'Protein Tips',
            message: de
              ? 'Gib mir proteinreiche Mahlzeit-Ideen.'
              : 'Give me high-protein meal ideas.',
            icon: '\ud83d\udcaa',
          },
        ];

      // ── Tracking: Training — Today ──
      case 'tracking_training':
        return [
          {
            id: 'workout_log',
            label: de ? 'Workout loggen' : 'Log Workout',
            message: de
              ? 'Ich habe gerade trainiert.'
              : 'I just worked out.',
            icon: '\ud83c\udfcb\ufe0f',
          },
          {
            id: 'workout_advice',
            label: de ? 'Training-Tipps' : 'Training Tips',
            message: de
              ? 'Welche \u00dcbungen sind heute dran?'
              : 'Which exercises should I do today?',
            icon: '\ud83d\udca1',
          },
        ];

      // ── Tracking: Training — Plan ──
      case 'tracking_training_plan':
        return [
          {
            id: 'plan_edit',
            label: de ? 'Plan anpassen' : 'Edit Plan',
            message: de
              ? 'Ich m\u00f6chte meinen Trainingsplan anpassen.'
              : 'I want to adjust my training plan.',
            icon: '\u270f\ufe0f',
          },
          {
            id: 'plan_evaluate',
            label: de ? 'Plan bewerten' : 'Evaluate Plan',
            message: de
              ? 'Wie gut ist mein aktueller Trainingsplan?'
              : 'How good is my current training plan?',
            icon: '\ud83d\udccb',
          },
          {
            id: 'plan_create',
            label: de ? 'Neuen Plan' : 'New Plan',
            message: de
              ? 'Erstell mir einen Trainingsplan.'
              : 'Create a training plan for me.',
            icon: '\ud83c\udd95',
          },
        ];

      // ── Tracking: Body ──
      case 'tracking_body':
        return [
          {
            id: 'body_analyze',
            label: de ? 'K\u00f6rper analysieren' : 'Analyze Body',
            message: de
              ? 'Analysiere meine K\u00f6rperkomposition.'
              : 'Analyze my body composition.',
            icon: '\ud83d\udcca',
          },
          {
            id: 'body_recomp',
            label: de ? 'Recomp-Tipps' : 'Recomp Tips',
            message: de
              ? 'Gib mir Tipps f\u00fcr Body Recomposition.'
              : 'Give me body recomposition tips.',
            icon: '\ud83d\udd04',
          },
        ];

      // ── Medical ──
      case 'medical':
        return [
          {
            id: 'medical_bp',
            label: de ? 'Blutdruck analysieren' : 'Analyze BP',
            message: de
              ? 'Analysiere meinen Blutdruck-Verlauf.'
              : 'Analyze my blood pressure trend.',
            icon: '\u2764\ufe0f',
          },
          {
            id: 'medical_substances',
            label: de ? 'Substanzen-Check' : 'Substance Check',
            message: de
              ? '\u00dcberpr\u00fcfe meine Substanzen und deren Wechselwirkungen.'
              : 'Check my substances and their interactions.',
            icon: '\ud83d\udc8a',
          },
          {
            id: 'medical_health',
            label: de ? 'Gesundheits-\u00dcbersicht' : 'Health Overview',
            message: de
              ? 'Gib mir einen Gesundheits-\u00dcberblick.'
              : 'Give me a health overview.',
            icon: '\ud83c\udfe5',
          },
        ];

      // ── Cockpit (Dashboard + Reports combined) ──
      case 'cockpit':
        return [
          {
            id: 'cockpit_status',
            label: de ? 'Tagesbilanz' : 'Daily Summary',
            message: de
              ? 'Wie steht mein Tag heute?'
              : 'How is my day going?',
            icon: '\ud83d\udcca',
          },
          {
            id: 'cockpit_week',
            label: de ? 'Woche analysieren' : 'Analyze Week',
            message: de
              ? 'Analysiere meine letzte Woche.'
              : 'Analyze my last week.',
            icon: '\ud83d\udcc8',
          },
          {
            id: 'cockpit_recommend',
            label: de ? 'Empfehlungen' : 'Recommendations',
            message: de
              ? 'Welche Empfehlungen hast du basierend auf meinen Trends?'
              : 'What recommendations do you have based on my trends?',
            icon: '\ud83d\udca1',
          },
        ];

      default:
        return [];
    }
  }, [pageId, language]);
}
