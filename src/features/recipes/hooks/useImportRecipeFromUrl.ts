/**
 * useImportRecipeFromUrl — Imports a recipe from a URL via the recipe-import Edge Function.
 *
 * 3-tier extraction: JSON-LD → Microdata → AI fallback (server-side).
 * Returns structured recipe data for preview/editing before save.
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Recipe } from '../types';

export interface ImportResult {
  success: boolean;
  source?: 'json_ld' | 'microdata' | 'ai';
  recipe?: Partial<Recipe> & { source_url: string; import_method: string };
  error?: string;
  message?: string;
}

export type ImportStatus = 'idle' | 'fetching' | 'extracting' | 'done' | 'error';

export function useImportRecipeFromUrl() {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [importedRecipe, setImportedRecipe] = useState<ImportResult['recipe'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const importFromUrl = useCallback(async (url: string): Promise<ImportResult> => {
    setStatus('fetching');
    setError(null);
    setImportedRecipe(null);

    try {
      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        const err = 'Nicht angemeldet. Bitte melde dich an.';
        setError(err);
        setStatus('error');
        return { success: false, error: 'unauthorized', message: err };
      }

      setStatus('extracting');

      // Call Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
      const response = await fetch(`${supabaseUrl}/functions/v1/recipe-import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({ url }),
      });

      const result: ImportResult = await response.json();

      if (!result.success || !result.recipe) {
        const msg = result.message || 'Rezept konnte nicht importiert werden.';
        setError(msg);
        setStatus('error');
        return { success: false, error: result.error, message: msg };
      }

      // Map to our Recipe partial format
      const recipe = result.recipe;
      setImportedRecipe(recipe);
      setStatus('done');
      return { success: true, source: result.source, recipe };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Netzwerkfehler beim Import.';
      setError(msg);
      setStatus('error');
      return { success: false, error: 'network_error', message: msg };
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setImportedRecipe(null);
    setError(null);
  }, []);

  return {
    status,
    importedRecipe,
    error,
    importFromUrl,
    reset,
  };
}
