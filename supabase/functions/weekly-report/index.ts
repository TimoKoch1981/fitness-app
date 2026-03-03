/**
 * Supabase Edge Function: weekly-report
 *
 * Generates a weekly summary report for a user.
 * Can be triggered by:
 * - A cron job (POST with user_id="all" and admin JWT)
 * - An individual user (POST with their JWT, generates their own report)
 *
 * Returns:
 * - JSON report data
 * - HTML email template (for email sending)
 *
 * Security:
 * - Auth: Validates Supabase JWT via Authorization header
 * - Users can only generate their own report (unless admin)
 *
 * @see https://supabase.com/docs/guides/functions
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ── JWT Helper ──────────────────────────────────────────────────────

interface JWTPayload {
  sub?: string;
  role?: string;
}

function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.replace(/^Bearer\s+/i, '').split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// ── Date Helpers ────────────────────────────────────────────────────

function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function getDefaultDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6); // Last 7 days including today
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

// ── Supabase Client (REST API) ──────────────────────────────────────

async function supabaseQuery(
  table: string,
  params: Record<string, string>,
  authHeader: string,
): Promise<unknown[]> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': authHeader,
      'apikey': anonKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase query failed for ${table}: ${response.status} ${errorText}`);
  }

  return await response.json() as unknown[];
}

// ── Report Generation ───────────────────────────────────────────────

interface ReportData {
  startDate: string;
  endDate: string;
  nutrition: {
    totalMeals: number;
    daysTracked: number;
    totalCalories: number;
    avgCaloriesPerDay: number;
    avgProteinPerDay: number;
    avgCarbsPerDay: number;
    avgFatPerDay: number;
  };
  training: {
    totalWorkouts: number;
    totalDurationMinutes: number;
    totalCaloriesBurned: number;
    daysWithWorkouts: number;
    avgDurationMinutes: number;
  };
  body: {
    hasData: boolean;
    startWeight?: number;
    endWeight?: number;
    weightChange?: number;
    startBodyFat?: number;
    endBodyFat?: number;
    bodyFatChange?: number;
  };
  sleep: {
    totalLogs: number;
    avgDurationMinutes: number;
    avgQuality: number;
    daysTracked: number;
  };
  streak: {
    currentStreak: number;
  };
}

interface MealRow {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface WorkoutRow {
  date: string;
  duration_minutes?: number;
  calories_burned?: number;
}

interface BodyRow {
  date: string;
  weight_kg?: number;
  body_fat_pct?: number;
}

interface SleepRow {
  date: string;
  duration_minutes?: number;
  quality?: number;
}

async function generateReport(
  userId: string,
  startDate: string,
  endDate: string,
  authHeader: string,
): Promise<ReportData> {
  // Fetch all data in parallel
  const [mealsRaw, workoutsRaw, bodyRaw, sleepRaw] = await Promise.all([
    supabaseQuery('meals', {
      select: 'date,calories,protein,carbs,fat',
      user_id: `eq.${userId}`,
      date: `gte.${startDate}`,
      'date@1': `lte.${endDate}`,
      order: 'date.asc',
    }, authHeader),
    supabaseQuery('workouts', {
      select: 'date,duration_minutes,calories_burned',
      user_id: `eq.${userId}`,
      date: `gte.${startDate}`,
      'date@1': `lte.${endDate}`,
      order: 'date.asc',
    }, authHeader),
    supabaseQuery('body_measurements', {
      select: 'date,weight_kg,body_fat_pct',
      user_id: `eq.${userId}`,
      date: `gte.${startDate}`,
      'date@1': `lte.${endDate}`,
      order: 'date.asc',
    }, authHeader),
    supabaseQuery('sleep_logs', {
      select: 'date,duration_minutes,quality',
      user_id: `eq.${userId}`,
      date: `gte.${startDate}`,
      'date@1': `lte.${endDate}`,
      order: 'date.asc',
    }, authHeader),
  ]);

  const meals = mealsRaw as MealRow[];
  const workouts = workoutsRaw as WorkoutRow[];
  const bodyMeasurements = bodyRaw as BodyRow[];
  const sleepLogs = sleepRaw as SleepRow[];

  const dates = getDateRange(startDate, endDate);
  const numDays = dates.length;

  // ── Nutrition ─────────────────────────────────────────
  const totalCalories = meals.reduce((sum, m) => sum + (m.calories ?? 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (m.protein ?? 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (m.carbs ?? 0), 0);
  const totalFat = meals.reduce((sum, m) => sum + (m.fat ?? 0), 0);
  const mealDays = new Set(meals.map(m => m.date)).size;

  // ── Training ──────────────────────────────────────────
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration_minutes ?? 0), 0);
  const totalBurned = workouts.reduce((sum, w) => sum + (w.calories_burned ?? 0), 0);
  const workoutDays = new Set(workouts.map(w => w.date)).size;

  // ── Body ──────────────────────────────────────────────
  const bodyWithWeight = bodyMeasurements.filter(b => b.weight_kg != null);
  const hasBodyData = bodyWithWeight.length >= 1;
  const startWeight = bodyWithWeight.length > 0 ? bodyWithWeight[0].weight_kg : undefined;
  const endWeight = bodyWithWeight.length > 0 ? bodyWithWeight[bodyWithWeight.length - 1].weight_kg : undefined;
  const startBodyFat = bodyWithWeight.length > 0 ? bodyWithWeight[0].body_fat_pct : undefined;
  const endBodyFat = bodyWithWeight.length > 0 ? bodyWithWeight[bodyWithWeight.length - 1].body_fat_pct : undefined;

  // ── Sleep ─────────────────────────────────────────────
  const sleepWithDuration = sleepLogs.filter(s => s.duration_minutes != null);
  const totalSleepDuration = sleepWithDuration.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
  const sleepWithQuality = sleepLogs.filter(s => s.quality != null);
  const totalQuality = sleepWithQuality.reduce((sum, s) => sum + (s.quality ?? 0), 0);
  const sleepDays = new Set(sleepLogs.map(s => s.date)).size;

  // ── Streak (count consecutive days from endDate backwards) ─
  const activityDates = new Set([
    ...meals.map(m => m.date),
    ...workouts.map(w => w.date),
  ]);
  let currentStreak = 0;
  const cursor = new Date(endDate);
  while (true) {
    const dateStr = cursor.toISOString().split('T')[0];
    if (activityDates.has(dateStr)) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    startDate,
    endDate,
    nutrition: {
      totalMeals: meals.length,
      daysTracked: mealDays,
      totalCalories,
      avgCaloriesPerDay: numDays > 0 ? Math.round(totalCalories / numDays) : 0,
      avgProteinPerDay: numDays > 0 ? Math.round(totalProtein / numDays) : 0,
      avgCarbsPerDay: numDays > 0 ? Math.round(totalCarbs / numDays) : 0,
      avgFatPerDay: numDays > 0 ? Math.round(totalFat / numDays) : 0,
    },
    training: {
      totalWorkouts: workouts.length,
      totalDurationMinutes: totalDuration,
      totalCaloriesBurned: totalBurned,
      daysWithWorkouts: workoutDays,
      avgDurationMinutes: workouts.length > 0 ? Math.round(totalDuration / workouts.length) : 0,
    },
    body: {
      hasData: hasBodyData,
      startWeight,
      endWeight,
      weightChange: startWeight != null && endWeight != null ? Math.round((endWeight - startWeight) * 10) / 10 : undefined,
      startBodyFat,
      endBodyFat,
      bodyFatChange: startBodyFat != null && endBodyFat != null ? Math.round((endBodyFat - startBodyFat) * 10) / 10 : undefined,
    },
    sleep: {
      totalLogs: sleepLogs.length,
      avgDurationMinutes: sleepWithDuration.length > 0 ? Math.round(totalSleepDuration / sleepWithDuration.length) : 0,
      avgQuality: sleepWithQuality.length > 0 ? Math.round(totalQuality / sleepWithQuality.length * 10) / 10 : 0,
      daysTracked: sleepDays,
    },
    streak: {
      currentStreak,
    },
  };
}

// ── HTML Email Template ─────────────────────────────────────────────

function generateEmailHtml(report: ReportData, userName: string): string {
  const { nutrition, training, body, sleep, streak } = report;
  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const avgSleepHours = sleep.avgDurationMinutes > 0
    ? `${Math.floor(sleep.avgDurationMinutes / 60)}h ${sleep.avgDurationMinutes % 60}min`
    : '-';

  const weightChangeText = body.weightChange != null
    ? `${body.weightChange > 0 ? '+' : ''}${body.weightChange} kg`
    : '-';

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FitBuddy Wochen-Report</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0d9488, #14b8a6); padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">FitBuddy</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">
        Wochen-Report: ${formatDate(report.startDate)} - ${formatDate(report.endDate)}
      </p>
    </div>

    <div style="padding: 24px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">
        Hallo ${userName || 'FitBuddy-Nutzer'},
      </p>
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">
        Hier ist dein Wochen-Report:
      </p>

      <!-- Nutrition -->
      <div style="background: #f0fdfa; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
        <h2 style="color: #0d9488; font-size: 16px; margin: 0 0 12px;">Ernaehrung</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Mahlzeiten gesamt</td>
            <td style="padding: 4px 0; color: #111827; font-size: 13px; text-align: right; font-weight: 600;">${nutrition.totalMeals}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Ø Kalorien/Tag</td>
            <td style="padding: 4px 0; color: #111827; font-size: 13px; text-align: right; font-weight: 600;">${nutrition.avgCaloriesPerDay} kcal</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Ø Protein/Tag</td>
            <td style="padding: 4px 0; color: #111827; font-size: 13px; text-align: right; font-weight: 600;">${nutrition.avgProteinPerDay}g</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Ø Kohlenhydrate/Tag</td>
            <td style="padding: 4px 0; color: #111827; font-size: 13px; text-align: right; font-weight: 600;">${nutrition.avgCarbsPerDay}g</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Ø Fett/Tag</td>
            <td style="padding: 4px 0; color: #111827; font-size: 13px; text-align: right; font-weight: 600;">${nutrition.avgFatPerDay}g</td>
          </tr>
        </table>
      </div>

      <!-- Training -->
      <div style="background: #eff6ff; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
        <h2 style="color: #2563eb; font-size: 16px; margin: 0 0 12px;">Training</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Workouts gesamt</td>
            <td style="padding: 4px 0; color: #111827; font-size: 13px; text-align: right; font-weight: 600;">${training.totalWorkouts}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Trainingszeit</td>
            <td style="padding: 4px 0; color: #111827; font-size: 13px; text-align: right; font-weight: 600;">${Math.floor(training.totalDurationMinutes / 60)}h ${training.totalDurationMinutes % 60}min</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Kalorien verbrannt</td>
            <td style="padding: 4px 0; color: #111827; font-size: 13px; text-align: right; font-weight: 600;">${training.totalCaloriesBurned} kcal</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Ø Dauer/Workout</td>
            <td style="padding: 4px 0; color: #111827; font-size: 13px; text-align: right; font-weight: 600;">${training.avgDurationMinutes} min</td>
          </tr>
        </table>
      </div>

      <!-- Body -->
      <div style="background: #faf5ff; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
        <h2 style="color: #7c3aed; font-size: 16px; margin: 0 0 12px;">Koerper</h2>
        ${body.hasData ? `
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Gewicht-Aenderung</td>
            <td style="padding: 4px 0; color: #111827; font-size: 13px; text-align: right; font-weight: 600;">${weightChangeText}</td>
          </tr>
          ${body.endWeight ? `<tr>
            <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Aktuelles Gewicht</td>
            <td style="padding: 4px 0; color: #111827; font-size: 13px; text-align: right; font-weight: 600;">${body.endWeight} kg</td>
          </tr>` : ''}
          ${body.bodyFatChange != null ? `<tr>
            <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">KFA-Aenderung</td>
            <td style="padding: 4px 0; color: #111827; font-size: 13px; text-align: right; font-weight: 600;">${body.bodyFatChange > 0 ? '+' : ''}${body.bodyFatChange}%</td>
          </tr>` : ''}
        </table>
        ` : '<p style="color: #6b7280; font-size: 13px;">Keine Koerpermessungen in diesem Zeitraum.</p>'}
      </div>

      <!-- Sleep -->
      <div style="background: #fefce8; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
        <h2 style="color: #ca8a04; font-size: 16px; margin: 0 0 12px;">Schlaf</h2>
        ${sleep.totalLogs > 0 ? `
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Ø Schlafdauer</td>
            <td style="padding: 4px 0; color: #111827; font-size: 13px; text-align: right; font-weight: 600;">${avgSleepHours}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Ø Qualitaet</td>
            <td style="padding: 4px 0; color: #111827; font-size: 13px; text-align: right; font-weight: 600;">${sleep.avgQuality}/5</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Tage getrackt</td>
            <td style="padding: 4px 0; color: #111827; font-size: 13px; text-align: right; font-weight: 600;">${sleep.daysTracked}</td>
          </tr>
        </table>
        ` : '<p style="color: #6b7280; font-size: 13px;">Keine Schlaf-Daten in diesem Zeitraum.</p>'}
      </div>

      <!-- Streak -->
      ${streak.currentStreak > 0 ? `
      <div style="background: #fff7ed; border-radius: 12px; padding: 16px; margin-bottom: 16px; text-align: center;">
        <p style="color: #ea580c; font-size: 32px; font-weight: 700; margin: 0;">${streak.currentStreak}</p>
        <p style="color: #9a3412; font-size: 14px; margin: 4px 0 0;">Tage Streak</p>
      </div>
      ` : ''}

      <!-- Footer -->
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 24px 0 0;">
        Dieser Report wurde automatisch von FitBuddy generiert.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── Main Handler ────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Validate auth ───────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const jwt = decodeJWT(authHeader);
  const callerUserId = jwt?.sub;
  if (!callerUserId) {
    return new Response(JSON.stringify({ error: 'Invalid or malformed JWT token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { user_id, start_date, end_date } = body;

    // Determine target user
    const targetUserId = user_id === 'all' ? callerUserId : (user_id || callerUserId);

    // Non-admin users can only generate their own report
    if (targetUserId !== callerUserId && jwt?.role !== 'service_role') {
      return new Response(JSON.stringify({ error: 'Forbidden: can only generate own report' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Date range (default: last 7 days)
    const defaultRange = getDefaultDateRange();
    const startDate = start_date || defaultRange.start;
    const endDate = end_date || defaultRange.end;

    // Generate report
    const report = await generateReport(targetUserId, startDate, endDate, authHeader);

    // Generate HTML email
    const html = generateEmailHtml(report, '');

    console.log(
      `[weekly-report] Generated report | user=${targetUserId} | ` +
      `range=${startDate}..${endDate} | meals=${report.nutrition.totalMeals} | ` +
      `workouts=${report.training.totalWorkouts}`
    );

    return new Response(JSON.stringify({ report, html }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error(`[weekly-report] Error: ${message}`);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
