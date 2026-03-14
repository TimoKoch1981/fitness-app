/**
 * useRecipeSearch — Search the web for recipes via the recipe-search Edge Function.
 * Returns structured search results for display in RecipeSearchDialog.
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  thumbnail: string | null;
  source: string;
}

export type SearchStatus = 'idle' | 'searching' | 'done' | 'error';

interface SearchResponse {
  success: boolean;
  results?: SearchResult[];
  query_used?: string;
  result_count?: number;
  error?: string;
  message?: string;
}

export function useRecipeSearch() {
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [queryUsed, setQueryUsed] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (
    query: string,
    context?: { goals?: string[]; restrictions?: string[] }
  ) => {
    if (!query.trim()) return;

    setStatus('searching');
    setError(null);
    setResults([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Nicht angemeldet. Bitte melde dich an.');
        setStatus('error');
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
      const response = await fetch(`${supabaseUrl}/functions/v1/recipe-search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({ query: query.trim(), context }),
      });

      const data: SearchResponse = await response.json();

      if (!data.success) {
        setError(data.message || 'Suche fehlgeschlagen.');
        setStatus('error');
        return;
      }

      setResults(data.results || []);
      setQueryUsed(data.query_used || query);
      setStatus('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Netzwerkfehler bei der Suche.';
      setError(msg);
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResults([]);
    setQueryUsed('');
    setError(null);
  }, []);

  return {
    status,
    results,
    queryUsed,
    error,
    search,
    reset,
  };
}
