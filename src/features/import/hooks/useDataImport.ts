/**
 * Hook for importing MyFitnessPal data into FitBuddy.
 *
 * Converts MFP rows to Supabase meal entries,
 * skips duplicates (same date + meal name + calories), and
 * returns import statistics.
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { mapMealType } from '../utils/mfpParser';
import type { MFPRow, ImportResult } from '../types';
import type { MealType } from '../../../types/health';

export function useMFPImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const importMFPData = useCallback(
    async (rows: MFPRow[], userId: string): Promise<ImportResult> => {
      setIsImporting(true);
      setProgress({ current: 0, total: rows.length });

      const result: ImportResult = {
        imported: 0,
        skipped: 0,
        errors: 0,
        totalRows: rows.length,
      };

      try {
        // Fetch existing meals for duplicate detection
        const dates = [...new Set(rows.map((r) => r.Date))];
        const { data: existingMeals } = await supabase
          .from('meals')
          .select('date, name, calories')
          .eq('user_id', userId)
          .in('date', dates);

        // Build a set of existing meal keys for O(1) lookup
        const existingKeys = new Set<string>();
        if (existingMeals) {
          for (const m of existingMeals) {
            existingKeys.add(mealKey(m.date, m.name, m.calories));
          }
        }

        // Batch insert (chunks of 50)
        const BATCH_SIZE = 50;
        const toInsert: Array<{
          user_id: string;
          date: string;
          name: string;
          type: MealType;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber?: number;
          source: string;
          source_ref: string;
        }> = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const mealName = row.Meal || 'Imported Meal';
          const key = mealKey(row.Date, mealName, row.Calories);

          if (existingKeys.has(key)) {
            result.skipped++;
          } else {
            toInsert.push({
              user_id: userId,
              date: row.Date,
              name: mealName,
              type: mapMealType(row.Meal),
              calories: row.Calories,
              protein: row.Protein,
              carbs: row.Carbs,
              fat: row.Fat,
              fiber: row.Fiber,
              source: 'import',
              source_ref: 'myfitnesspal',
            });
            existingKeys.add(key); // Prevent duplicates within the same import
          }

          setProgress({ current: i + 1, total: rows.length });
        }

        // Insert in batches
        for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
          const batch = toInsert.slice(i, i + BATCH_SIZE);
          const { error } = await supabase.from('meals').insert(batch);
          if (error) {
            result.errors += batch.length;
          } else {
            result.imported += batch.length;
          }
        }
      } catch {
        result.errors = rows.length - result.imported - result.skipped;
      } finally {
        setIsImporting(false);
        setProgress(null);
      }

      return result;
    },
    [],
  );

  return { importMFPData, isImporting, progress };
}

/** Build a unique key for duplicate detection. */
function mealKey(date: string, name: string, calories: number): string {
  return `${date}|${name.toLowerCase().trim()}|${Math.round(calories)}`;
}
