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
}

const SYSTEM_PROMPT_DE = `Du bist ein Nährwert-Experte. Der User gibt dir den Namen einer Mahlzeit oder eines Lebensmittels.
Schätze die Nährwerte basierend auf einer typischen Portion.

Portionsgrößen-Richtwerte:
- Fleisch/Fisch: 150g
- Reis/Nudeln (gekocht): 200g
- Kartoffeln: 200g
- Gemüse: 150g
- Brot: 1 Scheibe = 50g
- Ei: 60g
- Milch: 200ml
- Käse: 30g

Antworte AUSSCHLIESSLICH als JSON-Objekt im folgenden Format, ohne Markdown oder sonstigen Text:
{"calories": <Zahl>, "protein": <Zahl>, "carbs": <Zahl>, "fat": <Zahl>}

Alle Werte als ganze Zahlen. Protein, Carbs und Fat in Gramm.`;

const SYSTEM_PROMPT_EN = `You are a nutrition expert. The user gives you the name of a meal or food item.
Estimate nutritional values based on a typical serving size.

Serving size guidelines:
- Meat/Fish: 150g
- Rice/Pasta (cooked): 200g
- Potatoes: 200g
- Vegetables: 150g
- Bread: 1 slice = 50g
- Egg: 60g
- Milk: 200ml
- Cheese: 30g

Reply ONLY with a JSON object in this format, no markdown or other text:
{"calories": <number>, "protein": <number>, "carbs": <number>, "fat": <number>}

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
        max_tokens: 150,
        response_format: { type: 'json_object' },
      });

      const content = response.choices?.[0]?.message?.content ?? '';
      const parsed = JSON.parse(content);

      const result: NutritionEstimate = {
        calories: Math.round(Number(parsed.calories) || 0),
        protein: Math.round(Number(parsed.protein) || 0),
        carbs: Math.round(Number(parsed.carbs) || 0),
        fat: Math.round(Number(parsed.fat) || 0),
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
