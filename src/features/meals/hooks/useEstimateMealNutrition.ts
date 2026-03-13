/**
 * useEstimateMealNutrition — KI-basierte Nährwert-Schätzung für Mahlzeiten.
 *
 * Ruft die ai-proxy Edge Function auf und gibt geschätzte Makros zurück.
 * Nutzt gpt-4o-mini mit JSON-Output für strukturierte Ergebnisse.
 */

import { useState, useCallback } from 'react';
import { isUsingProxy } from '../../../lib/ai/provider';
import { proxyCompletionRequest } from '../../../lib/ai/supabaseProxy';

export interface NutritionEstimate {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  corrected_name?: string;
}

const SYSTEM_PROMPT_DE = `Du bist ein Nährwert-Experte. Der User gibt dir den Namen einer Mahlzeit oder eines Lebensmittels.
Berechne die Nährwerte so genau wie möglich.

WICHTIG — Mengenangaben:
- Wenn der User eine Menge angibt (z.B. "250g Skyr"), berechne die Nährwerte EXAKT für diese Menge.
- Rechne pro 100g und multipliziere mit der angegebenen Menge.
- Bei Kombinationen (z.B. "500g Skyr mit 1 Orange und 1 Mango") berechne JEDE Zutat einzeln und addiere die Werte.

Referenzwerte pro 100g:
- Skyr: 63 kcal, 11g Protein, 4g Carbs, 0.2g Fett
- Hähnchenbrust: 165 kcal, 31g Protein, 0g Carbs, 3.6g Fett
- Reis (gekocht): 130 kcal, 2.7g Protein, 28g Carbs, 0.3g Fett
- Nudeln (gekocht): 131 kcal, 5g Protein, 25g Carbs, 1.1g Fett
- Ei (60g): 93 kcal, 7.8g Protein, 0.7g Carbs, 6.6g Fett
- Orange (150g): 71 kcal, 1.4g Protein, 17g Carbs, 0.2g Fett
- Banane (120g): 107 kcal, 1.3g Protein, 26g Carbs, 0.4g Fett
- Mango (200g): 120 kcal, 1.6g Protein, 28g Carbs, 0.8g Fett

Portionsgrößen-Richtwerte (nur wenn KEINE Menge angegeben):
- Fleisch/Fisch: 150g, Reis/Nudeln: 200g, Kartoffeln: 200g
- Gemüse: 150g, Brot: 1 Scheibe = 50g, Milch: 200ml, Käse: 30g

Falls der Name Tippfehler enthält, korrigiere ihn automatisch.

Antworte AUSSCHLIESSLICH als JSON-Objekt im folgenden Format, ohne Markdown oder sonstigen Text:
{"calories": <Zahl>, "protein": <Zahl>, "carbs": <Zahl>, "fat": <Zahl>, "corrected_name": "<korrigierter Name oder Original wenn korrekt>"}

Alle Werte als ganze Zahlen. Protein, Carbs und Fat in Gramm.`;

const SYSTEM_PROMPT_EN = `You are a nutrition expert. The user gives you the name of a meal or food item.
Calculate nutritional values as accurately as possible.

IMPORTANT — Quantities:
- When the user specifies an amount (e.g. "250g yogurt"), calculate nutrition EXACTLY for that amount.
- Calculate per 100g and multiply by the given amount.
- For combinations (e.g. "500g yogurt with 1 orange and 1 mango"), calculate EACH ingredient separately and sum the values.

Reference values per 100g:
- Greek yogurt/Skyr: 63 kcal, 11g protein, 4g carbs, 0.2g fat
- Chicken breast: 165 kcal, 31g protein, 0g carbs, 3.6g fat
- Rice (cooked): 130 kcal, 2.7g protein, 28g carbs, 0.3g fat
- Pasta (cooked): 131 kcal, 5g protein, 25g carbs, 1.1g fat
- Egg (60g): 93 kcal, 7.8g protein, 0.7g carbs, 6.6g fat
- Orange (150g): 71 kcal, 1.4g protein, 17g carbs, 0.2g fat
- Banana (120g): 107 kcal, 1.3g protein, 26g carbs, 0.4g fat
- Mango (200g): 120 kcal, 1.6g protein, 28g carbs, 0.8g fat

Serving size guidelines (ONLY when NO amount specified):
- Meat/Fish: 150g, Rice/Pasta: 200g, Potatoes: 200g
- Vegetables: 150g, Bread: 1 slice = 50g, Milk: 200ml, Cheese: 30g

If the name contains typos, auto-correct them.

Reply ONLY with a JSON object in this format, no markdown or other text:
{"calories": <number>, "protein": <number>, "carbs": <number>, "fat": <number>, "corrected_name": "<corrected name or original if correct>"}

All values as integers. Protein, carbs and fat in grams.`;

export function useEstimateMealNutrition() {
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState('');

  const estimate = useCallback(async (
    foodName: string,
    language: string = 'de',
  ): Promise<NutritionEstimate | null> => {
    if (!foodName.trim()) return null;

    setIsEstimating(true);
    setEstimateError('');

    try {
      if (!isUsingProxy()) {
        setEstimateError(language === 'de'
          ? 'KI-Schätzung benötigt Cloud-Verbindung'
          : 'AI estimation requires cloud connection');
        return null;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        setEstimateError(language === 'de'
          ? 'Supabase nicht konfiguriert'
          : 'Supabase not configured');
        return null;
      }

      const systemPrompt = language === 'de' ? SYSTEM_PROMPT_DE : SYSTEM_PROMPT_EN;

      const response = await proxyCompletionRequest(supabaseUrl, anonKey, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: foodName.trim() },
      ], {
        model: 'gpt-4o-mini',
        temperature: 0.1,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      });

      const content = response.choices?.[0]?.message?.content ?? '';
      const parsed = JSON.parse(content);

      const result: NutritionEstimate = {
        calories: Math.round(Number(parsed.calories) || 0),
        protein: Math.round(Number(parsed.protein) || 0),
        carbs: Math.round(Number(parsed.carbs) || 0),
        fat: Math.round(Number(parsed.fat) || 0),
        ...(parsed.corrected_name ? { corrected_name: String(parsed.corrected_name) } : {}),
      };

      // Sanity check — reject obviously wrong results
      if (result.calories <= 0 || result.calories > 5000) {
        setEstimateError(language === 'de'
          ? 'Unplausible Schätzung — bitte manuell eingeben'
          : 'Implausible estimate — please enter manually');
        return null;
      }

      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setEstimateError(language === 'de'
        ? `Schätzung fehlgeschlagen: ${msg}`
        : `Estimation failed: ${msg}`);
      return null;
    } finally {
      setIsEstimating(false);
    }
  }, []);

  return { estimate, isEstimating, estimateError, clearError: () => setEstimateError('') };
}
