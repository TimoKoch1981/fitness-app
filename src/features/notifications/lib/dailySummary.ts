import { supabase } from '../../../lib/supabase';

/**
 * Build the daily summary notification body text.
 * Queries today's meals and workouts from Supabase.
 *
 * @param userId - The user's ID
 * @param language - 'de' or 'en'
 * @returns Formatted summary string
 */
export async function buildDailySummaryBody(
  userId: string,
  language: 'de' | 'en',
): Promise<string> {
  const todayStr = new Date().toISOString().split('T')[0]!;

  // Fetch today's meals
  const { data: meals } = await supabase
    .from('meals')
    .select('calories, protein')
    .eq('user_id', userId)
    .gte('date', todayStr)
    .lte('date', todayStr);

  // Fetch today's workouts
  const { data: workouts } = await supabase
    .from('workouts')
    .select('id')
    .eq('user_id', userId)
    .gte('date', todayStr)
    .lte('date', todayStr);

  const totalCal = meals?.reduce((sum, m) => sum + (m.calories ?? 0), 0) ?? 0;
  const totalProt = meals?.reduce((sum, m) => sum + (m.protein ?? 0), 0) ?? 0;
  const workoutCount = workouts?.length ?? 0;

  if (language === 'de') {
    const parts: string[] = [];
    parts.push(`${Math.round(totalCal)} kcal`);
    parts.push(`${Math.round(totalProt)}g Protein`);
    if (workoutCount > 0) {
      parts.push(`${workoutCount} Training${workoutCount > 1 ? 's' : ''}`);
    } else {
      parts.push('kein Training');
    }
    return `Heute: ${parts.join(', ')}`;
  }

  // English
  const parts: string[] = [];
  parts.push(`${Math.round(totalCal)} kcal`);
  parts.push(`${Math.round(totalProt)}g protein`);
  if (workoutCount > 0) {
    parts.push(`${workoutCount} workout${workoutCount > 1 ? 's' : ''}`);
  } else {
    parts.push('no workout');
  }
  return `Today: ${parts.join(', ')}`;
}
