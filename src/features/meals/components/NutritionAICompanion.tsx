/**
 * NutritionAICompanion — context-aware AI nutrition coaching card.
 *
 * Shows macro deficit summary and contextual Buddy suggestion chips
 * on the Meals start page. Only visible when today is selected,
 * meals are logged, AND macro gaps exceed 20%.
 *
 * Collapsible via localStorage.
 */

import { useState, useMemo } from 'react';
import { Brain, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useInlineBuddyChat } from '../../../shared/components/InlineBuddyChatContext';

interface NutritionAICompanionProps {
  language: 'de' | 'en';
  totals: { calories: number; protein: number; carbs: number; fat: number };
  energyBalance: {
    caloriesGoal: number;
    proteinGoal: number;
    carbsGoal: number;
    fatGoal: number;
    tdee: number;
    totalExpenditure: number;
  };
}

const LS_KEY = 'fitbuddy_nutrition_ai_collapsed';

export function NutritionAICompanion({ language, totals, energyBalance }: NutritionAICompanionProps) {
  const { openBuddyChat } = useInlineBuddyChat();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(LS_KEY) === 'true');
  const [dismissed, setDismissed] = useState(false);

  // Calculate deficits
  const deficits = useMemo(() => {
    const calGoal = energyBalance.caloriesGoal || energyBalance.tdee;
    const proGoal = energyBalance.proteinGoal;
    const carbGoal = energyBalance.carbsGoal;
    const fatGoal = energyBalance.fatGoal;

    const calRemaining = Math.max(0, calGoal - totals.calories);
    const proRemaining = Math.max(0, proGoal - totals.protein);
    const carbRemaining = Math.max(0, carbGoal - totals.carbs);
    const fatRemaining = Math.max(0, fatGoal - totals.fat);

    const calPct = calGoal > 0 ? (totals.calories / calGoal) * 100 : 100;
    const proPct = proGoal > 0 ? (totals.protein / proGoal) * 100 : 100;

    return {
      calRemaining, proRemaining, carbRemaining, fatRemaining,
      calPct, proPct,
      hasSignificantGap: calPct < 80 || proPct < 80,
      calGoal, proGoal, carbGoal, fatGoal,
    };
  }, [totals, energyBalance]);

  // Don't show if no significant gap or dismissed
  if (!deficits.hasSignificantGap || dismissed) return null;

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(LS_KEY, String(next));
  };

  const de = language === 'de';

  // Build context-aware Buddy suggestion chips
  const chips = buildChips(de, deficits, totals);

  return (
    <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={toggleCollapsed}
        className="w-full flex items-center gap-2 p-3 group"
      >
        <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Brain className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex-1 text-left">
          <span className="text-xs font-semibold text-gray-700">
            {de ? 'Dein Ernährungs-Coach' : 'Your Nutrition Coach'}
          </span>
          {collapsed && (
            <span className="ml-2 text-[10px] text-gray-400">
              {de
                ? `Noch ${deficits.calRemaining} kcal • ${Math.round(deficits.proRemaining)}g Protein`
                : `${deficits.calRemaining} kcal • ${Math.round(deficits.proRemaining)}g protein left`
              }
            </span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
          className="p-1 text-gray-300 hover:text-gray-500 transition-colors"
          aria-label={de ? 'Schließen' : 'Close'}
        >
          <X className="h-3.5 w-3.5" />
        </button>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-gray-300 group-hover:text-violet-500 transition-colors" />
        ) : (
          <ChevronUp className="h-4 w-4 text-gray-300 group-hover:text-violet-500 transition-colors" />
        )}
      </button>

      {/* Expanded content */}
      {!collapsed && (
        <div className="px-3 pb-3 space-y-2.5">
          {/* Macro deficit summary */}
          <div className="text-[11px] text-gray-600 leading-relaxed bg-violet-50 rounded-lg p-2.5">
            {de ? (
              <>
                Dir fehlen noch <strong>{deficits.calRemaining} kcal</strong>
                {deficits.proGoal > 0 && <> und <strong>{Math.round(deficits.proRemaining)}g Protein</strong></>}.
                {' '}Hier sind passende Vorschläge:
              </>
            ) : (
              <>
                You still need <strong>{deficits.calRemaining} kcal</strong>
                {deficits.proGoal > 0 && <> and <strong>{Math.round(deficits.proRemaining)}g protein</strong></>}.
                {' '}Here are some suggestions:
              </>
            )}
          </div>

          {/* Context-aware suggestion chips */}
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => openBuddyChat(chip.message, 'nutrition')}
                className="flex-shrink-0 px-3 py-1.5 text-[11px] font-medium bg-violet-50 text-violet-700 rounded-full border border-violet-200 hover:bg-violet-100 hover:border-violet-300 transition-colors"
              >
                {chip.icon && <span className="mr-1">{chip.icon}</span>}
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Chip builder ──────────────────────────────────────────────────────────────

interface Chip {
  id: string;
  icon: string;
  label: string;
  message: string;
}

function buildChips(
  de: boolean,
  deficits: {
    calRemaining: number;
    proRemaining: number;
    carbRemaining: number;
    fatRemaining: number;
    proPct: number;
    proGoal: number;
  },
  totals: { calories: number; protein: number; carbs: number; fat: number },
): Chip[] {
  const chips: Chip[] = [];

  // 1. Protein-focused (if protein gap > 30%)
  if (deficits.proPct < 70 && deficits.proGoal > 0) {
    chips.push({
      id: 'protein',
      icon: '🍗',
      label: de ? 'Proteinreiche Mahlzeit' : 'High-protein meal',
      message: de
        ? `Schlage mir eine proteinreiche Mahlzeit vor. Mir fehlen noch ${Math.round(deficits.proRemaining)}g Protein und ${deficits.calRemaining} kcal für heute.`
        : `Suggest a high-protein meal. I still need ${Math.round(deficits.proRemaining)}g protein and ${deficits.calRemaining} kcal today.`,
    });
  }

  // 2. From user's recipes
  chips.push({
    id: 'recipes',
    icon: '📖',
    label: de ? 'Aus meinen Rezepten' : 'From my recipes',
    message: de
      ? `Welches meiner gespeicherten Rezepte passt am besten zu meinen verbleibenden Makros? Ich brauche noch ${deficits.calRemaining} kcal, ${Math.round(deficits.proRemaining)}g Protein, ${Math.round(deficits.carbRemaining)}g Kohlenhydrate und ${Math.round(deficits.fatRemaining)}g Fett.`
      : `Which of my saved recipes best fits my remaining macros? I still need ${deficits.calRemaining} kcal, ${Math.round(deficits.proRemaining)}g protein, ${Math.round(deficits.carbRemaining)}g carbs, and ${Math.round(deficits.fatRemaining)}g fat.`,
  });

  // 3. Quick snack (if gap is small — under 500 kcal)
  if (deficits.calRemaining > 0 && deficits.calRemaining <= 500) {
    chips.push({
      id: 'snack',
      icon: '🥜',
      label: de ? 'Schneller Snack' : 'Quick snack',
      message: de
        ? `Gib mir einen schnellen Snack-Vorschlag für ca. ${deficits.calRemaining} kcal und ${Math.round(deficits.proRemaining)}g Protein. Am besten etwas Einfaches ohne Kochen.`
        : `Give me a quick snack suggestion for about ${deficits.calRemaining} kcal and ${Math.round(deficits.proRemaining)}g protein. Preferably something simple, no cooking needed.`,
    });
  }

  // 4. Full meal suggestion (if gap is larger — over 500 kcal)
  if (deficits.calRemaining > 500) {
    chips.push({
      id: 'full-meal',
      icon: '🍽️',
      label: de ? 'Mahlzeit vorschlagen' : 'Suggest a meal',
      message: de
        ? `Schlage mir eine vollständige Mahlzeit vor für ca. ${deficits.calRemaining} kcal. Mir fehlen noch ${Math.round(deficits.proRemaining)}g Protein, ${Math.round(deficits.carbRemaining)}g Kohlenhydrate und ${Math.round(deficits.fatRemaining)}g Fett.`
        : `Suggest a complete meal for about ${deficits.calRemaining} kcal. I still need ${Math.round(deficits.proRemaining)}g protein, ${Math.round(deficits.carbRemaining)}g carbs, and ${Math.round(deficits.fatRemaining)}g fat.`,
    });
  }

  // 5. Rate my day (always shown)
  chips.push({
    id: 'rate-day',
    icon: '🎯',
    label: de ? 'Tag bewerten' : 'Rate my day',
    message: de
      ? `Bewerte meinen heutigen Ernährungstag. Ich habe bisher ${totals.calories} kcal, ${Math.round(totals.protein)}g Protein, ${Math.round(totals.carbs)}g Kohlenhydrate und ${Math.round(totals.fat)}g Fett gegessen. Berücksichtige dabei meine Ziele, Allergien und Gesundheitsdaten.`
      : `Rate my nutrition today. So far I've had ${totals.calories} kcal, ${Math.round(totals.protein)}g protein, ${Math.round(totals.carbs)}g carbs, and ${Math.round(totals.fat)}g fat. Consider my goals, allergies, and health data.`,
  });

  return chips;
}
