import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.warn(
    '[FitBuddy] VITE_SUPABASE_ANON_KEY is not set. ' +
    'Set it in .env.local or start Supabase CLI with `npx supabase start`.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
