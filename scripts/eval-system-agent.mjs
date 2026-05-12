#!/usr/bin/env node
/**
 * LLM-Eval-Regression-Suite for the System Agent (P0-2).
 *
 * Runs a 10-case golden set against BOTH providers (OpenAI gpt-4o-mini and
 * Anthropic claude-sonnet-4-6) through the production ai-proxy Edge Function,
 * so we measure exactly what the user gets. Output: a Markdown report with
 * provider-by-provider pass/fail breakdown.
 *
 * Usage:
 *   node scripts/eval-system-agent.mjs                  # both providers
 *   node scripts/eval-system-agent.mjs --provider=openai
 *   node scripts/eval-system-agent.mjs --provider=anthropic
 *   node scripts/eval-system-agent.mjs --case=3         # just case #3
 *
 * Reads VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY from .env.production.
 *
 * Exit code: 0 on >=9/10 pass for each requested provider, 1 otherwise.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// ── Env loading (lightweight, no dotenv dep) ───────────────────────────

function loadEnvFile(path) {
  try {
    const raw = readFileSync(path, 'utf8');
    const map = {};
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq < 0) continue;
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1).trim();
      map[key] = val;
    }
    return map;
  } catch {
    return {};
  }
}

const envProd = loadEnvFile(join(projectRoot, '.env.production'));
const SUPABASE_URL = envProd.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = envProd.VITE_SUPABASE_ANON_KEY;
const CLAUDE_MODEL = envProd.VITE_ANTHROPIC_MODEL_SYSTEM ?? 'claude-sonnet-4-6';
const OPENAI_MODEL = envProd.VITE_OPENAI_MODEL ?? 'gpt-4o-mini';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[eval] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing in .env.production');
  process.exit(2);
}

const AI_PROXY_URL = `${SUPABASE_URL}/functions/v1/ai-proxy`;

// ── CLI args ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const providerArg = args.find((a) => a.startsWith('--provider='))?.slice('--provider='.length);
const caseArg = args.find((a) => a.startsWith('--case='))?.slice('--case='.length);

const PROVIDERS_TO_RUN = providerArg
  ? [providerArg]
  : ['openai', 'anthropic'];

// ── System prompt (kept in sync with src/lib/ai/agents/systemAgent.ts) ─

function buildSystemPrompt() {
  const now = new Date();
  const todayISO = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);
  const dayOfWeekDE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][now.getDay()];
  return [
    '## System-Steuerungs-Agent',
    '',
    'Du bist der System-Agent der FitBuddy-App. Deine einzige Aufgabe:',
    'Wandle die Beschreibung des Experten-Agents in einen praezisen, VOLLSTAENDIGEN Function Call um.',
    '',
    '### AKTUELLES DATUM UND UHRZEIT (PFLICHT-ANKER):',
    `- HEUTE ist: ${todayISO} (${dayOfWeekDE})`,
    `- Aktuelle Uhrzeit: ${currentTime}`,
    `- Wenn im date-Feld "heute" oder nichts steht: VERWENDE IMMER ${todayISO}`,
    '- Bei "gestern" = HEUTE minus 1 Tag, bei "vorgestern" = HEUTE minus 2 Tage',
    '- NIEMALS ein Datum aus dem Training (z.B. 2023-10-04) verwenden',
    '',
    '### Regeln:',
    '1. Rufe GENAU EINE Funktion pro Aktion auf',
    '2. Extrahiere ALLE genannten Werte aus der Beschreibung',
    '3. Bei save_training_plan MIT mehreren Tagen: days[] MUSS ALLE Tage enthalten',
    '4. Bei mehreren Aktionen: rufe mehrere Funktionen auf',
    '5. Defaults: date=heute, time=jetzt, source="ai"',
  ].join('\n');
}

// ── Compact tool definitions (subset, for eval only) ───────────────────
//
// We don't import the production tool set — keep this script standalone.
// All assertions below only check fields present in these schemas.

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'log_meal',
      description: 'Mahlzeit loggen mit Name, Kalorien und Makros.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'YYYY-MM-DD' },
          name: { type: 'string' },
          type: { type: 'string', enum: ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'snack'] },
          calories: { type: 'number' },
          protein: { type: 'number' },
          carbs: { type: 'number' },
          fat: { type: 'number' },
        },
        required: ['name', 'calories', 'protein', 'carbs', 'fat'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_workout',
      description: 'Training loggen mit Uebungen, Saetzen, Wiederholungen, Gewicht.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string', enum: ['strength', 'cardio', 'flexibility', 'hiit', 'sports', 'other'] },
          duration_minutes: { type: 'number' },
          exercises: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                sets: { type: 'number' },
                reps: { type: 'number' },
                weight_kg: { type: 'number' },
              },
              required: ['name'],
            },
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_body',
      description: 'Koerperwerte loggen (Gewicht, KFA, Umfaenge).',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          weight_kg: { type: 'number' },
          body_fat_pct: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_blood_pressure',
      description: 'Blutdruck loggen (systolisch, diastolisch, Puls).',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          systolic: { type: 'number' },
          diastolic: { type: 'number' },
          pulse: { type: 'number' },
        },
        required: ['systolic', 'diastolic'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_substance',
      description: 'Substanz-Einnahme loggen.',
      parameters: {
        type: 'object',
        properties: {
          substance_name: { type: 'string' },
          date: { type: 'string' },
          dosage_taken: { type: 'string' },
        },
        required: ['substance_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'save_training_plan',
      description: 'Trainingsplan speichern mit allen Tagen.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          days_per_week: { type: 'number' },
          split_type: { type: 'string' },
          days: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                day_number: { type: 'number' },
                name: { type: 'string' },
                exercises: {
                  type: 'array',
                  items: { type: 'object', properties: { name: { type: 'string' } } },
                },
              },
              required: ['day_number', 'name'],
            },
          },
        },
        required: ['name', 'days_per_week', 'days'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_substance',
      description: 'Neue Substanz im Profil anlegen.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          category: { type: 'string' },
          dosage: { type: 'string' },
        },
        required: ['name'],
      },
    },
  },
];

// ── Helpers ────────────────────────────────────────────────────────────

const todayISO = () => new Date().toISOString().split('T')[0];
const yesterdayISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

// ── Golden-Set Cases ──────────────────────────────────────────────────

const CASES = [
  {
    id: 1,
    label: 'Strength workout w/ sets/reps/weight',
    description: 'Heute Bankdruecken 5×5 mit 100kg',
    expected_action: 'log_workout',
    assertions: [
      { name: 'has-name-bench', check: (d) => /bank/i.test(String(d.name ?? '')) },
      { name: 'date=today', check: (d) => d.date === todayISO() },
      { name: 'exercises.length>=1', check: (d) => Array.isArray(d.exercises) && d.exercises.length >= 1 },
      { name: 'sets=5 & reps=5 & weight=100', check: (d) => {
          const ex = d.exercises?.[0];
          return ex && Number(ex.sets) === 5 && Number(ex.reps) === 5 && Number(ex.weight_kg) === 100;
        } },
    ],
  },
  {
    id: 2,
    label: 'Multi-day training plan (4 days)',
    description: 'Erstelle einen 4er-Split Trainingsplan: Tag 1 Push, Tag 2 Pull, Tag 3 Beine, Tag 4 Cardio. Jeder Tag mit 4-5 Uebungen.',
    expected_action: 'save_training_plan',
    assertions: [
      { name: 'days_per_week=4', check: (d) => Number(d.days_per_week) === 4 },
      { name: 'days.length===4', check: (d) => Array.isArray(d.days) && d.days.length === 4 },
      { name: 'all days have name', check: (d) => Array.isArray(d.days) && d.days.every((day) => typeof day.name === 'string' && day.name.length > 0) },
      { name: 'all days have exercises', check: (d) => Array.isArray(d.days) && d.days.every((day) => Array.isArray(day.exercises) && day.exercises.length >= 1) },
    ],
  },
  {
    id: 3,
    label: 'Meal with macros',
    description: '500g Skyr und 2 Orangen, Snack, 430 kcal, 52g Protein, 58g Kohlenhydrate, 2g Fett.',
    expected_action: 'log_meal',
    assertions: [
      { name: 'has-name-skyr', check: (d) => /skyr/i.test(String(d.name ?? '')) },
      { name: 'date=today', check: (d) => d.date === todayISO() },
      { name: 'calories~430', check: (d) => Math.abs(Number(d.calories) - 430) <= 10 },
      { name: 'protein~52', check: (d) => Math.abs(Number(d.protein) - 52) <= 3 },
      { name: 'carbs~58', check: (d) => Math.abs(Number(d.carbs) - 58) <= 3 },
      { name: 'fat~2', check: (d) => Math.abs(Number(d.fat) - 2) <= 2 },
    ],
  },
  {
    id: 4,
    label: 'Substance log (PED)',
    description: 'Heute 12mg Anastrozol eingenommen.',
    expected_action: 'log_substance',
    assertions: [
      { name: 'has-substance-name', check: (d) => /anastro/i.test(String(d.substance_name ?? '')) },
      { name: 'date=today', check: (d) => d.date === todayISO() },
      { name: 'dosage-mentions-12', check: (d) => /12/.test(String(d.dosage_taken ?? '')) },
    ],
  },
  {
    id: 5,
    label: 'Blood pressure with pulse',
    description: 'BD heute 135/85, Puls 72.',
    expected_action: 'log_blood_pressure',
    assertions: [
      { name: 'systolic=135', check: (d) => Number(d.systolic) === 135 },
      { name: 'diastolic=85', check: (d) => Number(d.diastolic) === 85 },
      { name: 'pulse=72', check: (d) => Number(d.pulse) === 72 },
      { name: 'date=today', check: (d) => d.date === todayISO() },
    ],
  },
  {
    id: 6,
    label: 'Body weight with comma',
    description: 'Mein Gewicht heute: 87,5 kg.',
    expected_action: 'log_body',
    assertions: [
      { name: 'weight=87.5', check: (d) => Math.abs(Number(d.weight_kg) - 87.5) < 0.01 },
      { name: 'date=today', check: (d) => d.date === todayISO() },
    ],
  },
  {
    id: 7,
    label: 'Backdated meal (yesterday)',
    description: 'Mahlzeit von gestern abend: Pizza Salami, 850 kcal, 32g Protein, 90g Kohlenhydrate, 38g Fett.',
    expected_action: 'log_meal',
    assertions: [
      { name: 'has-name-pizza', check: (d) => /pizza/i.test(String(d.name ?? '')) },
      { name: 'date=yesterday', check: (d) => d.date === yesterdayISO() },
      { name: 'calories~850', check: (d) => Math.abs(Number(d.calories) - 850) <= 30 },
    ],
  },
  {
    id: 8,
    label: 'Time-of-day → meal type inference',
    description: 'Morgens: Haferflocken mit Banane, 380 kcal, 12g Protein, 65g Kohlenhydrate, 6g Fett.',
    expected_action: 'log_meal',
    assertions: [
      { name: 'type=breakfast', check: (d) => d.type === 'breakfast' },
      { name: 'has-name', check: (d) => String(d.name ?? '').length > 3 },
    ],
  },
  {
    id: 9,
    label: 'Add substance to profile',
    description: 'Lege bei mir Testosteron Enantat 250mg/Woche als Substanz an, Kategorie TRT.',
    expected_action: 'add_substance',
    assertions: [
      { name: 'has-name', check: (d) => /test/i.test(String(d.name ?? '')) },
      { name: 'category=trt', check: (d) => /trt/i.test(String(d.category ?? '')) },
      { name: 'dosage-250', check: (d) => /250/.test(String(d.dosage ?? '')) },
    ],
  },
  {
    id: 10,
    label: 'Cardio workout (Laufen)',
    description: 'Heute 8 km gelaufen, ca. 45 Minuten.',
    expected_action: 'log_workout',
    assertions: [
      { name: 'type=cardio', check: (d) => d.type === 'cardio' },
      { name: 'duration~45', check: (d) => Math.abs(Number(d.duration_minutes) - 45) <= 5 },
      { name: 'date=today', check: (d) => d.date === todayISO() },
    ],
  },
];

// ── Provider call ─────────────────────────────────────────────────────

async function callSystemAgent(provider, caseDef) {
  const model = provider === 'anthropic' ? CLAUDE_MODEL : OPENAI_MODEL;
  const userContent = `Aktion: ${caseDef.expected_action}\nBeschreibung: ${caseDef.description}`;
  const body = {
    provider,
    model,
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: userContent },
    ],
    tools: TOOLS,
    tool_choice: 'required',
    max_tokens: 4096,
    temperature: 0,
    stream: false,
  };

  const t0 = Date.now();
  let res;
  try {
    res = await fetch(AI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return { ok: false, error: `fetch failed: ${err.message ?? err}`, latencyMs: Date.now() - t0 };
  }
  const latencyMs = Date.now() - t0;

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}`, latencyMs, provider: res.headers.get('x-provider') };
  }

  const data = await res.json().catch(() => null);
  if (!data) return { ok: false, error: 'invalid JSON response', latencyMs };

  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    return { ok: false, error: 'no tool_calls in response', latencyMs, raw_content: data.choices?.[0]?.message?.content };
  }

  let parsedArgs;
  try {
    parsedArgs = JSON.parse(toolCall.function?.arguments ?? '{}');
  } catch (err) {
    return { ok: false, error: `args JSON parse failed: ${err.message}`, latencyMs };
  }

  return {
    ok: true,
    action_type: toolCall.function?.name ?? 'unknown',
    args: parsedArgs,
    latencyMs,
    tokens: data.usage?.total_tokens ?? null,
    provider_header: res.headers.get('x-provider'),
    model_returned: data.model,
  };
}

function runAssertions(caseDef, callResult) {
  if (!callResult.ok) {
    return {
      passed: 0,
      total: caseDef.assertions.length + 1,
      details: [{ name: 'call-success', passed: false, error: callResult.error }],
    };
  }

  const details = [];
  details.push({
    name: 'action_type-match',
    passed: callResult.action_type === caseDef.expected_action,
    info: callResult.action_type === caseDef.expected_action
      ? caseDef.expected_action
      : `got ${callResult.action_type}, want ${caseDef.expected_action}`,
  });
  for (const a of caseDef.assertions) {
    let passed = false;
    let error;
    try {
      passed = !!a.check(callResult.args);
    } catch (err) {
      error = err.message ?? String(err);
    }
    details.push({ name: a.name, passed, error });
  }

  const passed = details.filter((d) => d.passed).length;
  return { passed, total: details.length, details };
}

// ── Main loop ─────────────────────────────────────────────────────────

async function runProvider(provider, casesToRun) {
  const results = [];
  for (const c of casesToRun) {
    const t0 = Date.now();
    const call = await callSystemAgent(provider, c);
    const verdict = runAssertions(c, call);
    results.push({
      case: c,
      call,
      verdict,
      wallMs: Date.now() - t0,
    });
    const dot = verdict.passed === verdict.total ? '✓' : verdict.passed > 0 ? '~' : '✗';
    process.stdout.write(`  ${dot} #${c.id} ${verdict.passed}/${verdict.total}  (${call.latencyMs}ms)\n`);
  }
  return results;
}

function makeReport(allResults) {
  const lines = [];
  lines.push(`# SystemAgent LLM Eval Report — ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`Cases run: ${CASES.length}${caseArg ? ` (filtered to #${caseArg})` : ''}.  Providers: ${PROVIDERS_TO_RUN.join(', ')}.`);
  lines.push('');

  // Summary table
  lines.push('## Summary');
  lines.push('');
  lines.push('| Provider | Model | Passed | Cases | Avg Latency | Total Tokens |');
  lines.push('|---|---|---|---|---|---|');
  for (const [provider, results] of Object.entries(allResults)) {
    const cases = results.length;
    const fullPass = results.filter((r) => r.verdict.passed === r.verdict.total).length;
    const avgLatency = Math.round(results.reduce((s, r) => s + r.call.latencyMs, 0) / cases);
    const tokens = results.reduce((s, r) => s + (r.call.tokens ?? 0), 0);
    const model = provider === 'anthropic' ? CLAUDE_MODEL : OPENAI_MODEL;
    lines.push(`| ${provider} | \`${model}\` | **${fullPass}/${cases}** | ${cases} | ${avgLatency}ms | ${tokens} |`);
  }
  lines.push('');

  // Per-case breakdown
  lines.push('## Per Case');
  lines.push('');
  for (const c of CASES.filter((c) => !caseArg || String(c.id) === caseArg)) {
    lines.push(`### #${c.id} — ${c.label}`);
    lines.push(`> ${c.description}`);
    lines.push('');
    lines.push('| Provider | Verdict | Latency | Detail |');
    lines.push('|---|---|---|---|');
    for (const provider of PROVIDERS_TO_RUN) {
      const r = allResults[provider]?.find((x) => x.case.id === c.id);
      if (!r) continue;
      const score = `${r.verdict.passed}/${r.verdict.total}`;
      const status = r.verdict.passed === r.verdict.total ? '✅' : r.verdict.passed > 0 ? '⚠️' : '❌';
      const failed = r.verdict.details.filter((d) => !d.passed).map((d) => d.name + (d.info ? ` (${d.info})` : '') + (d.error ? ` [err: ${d.error}]` : ''));
      const detail = failed.length === 0 ? 'all asserts passed' : `failed: ${failed.join(', ')}`;
      lines.push(`| ${provider} | ${status} ${score} | ${r.call.latencyMs}ms | ${detail} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ── Entry point ───────────────────────────────────────────────────────

const casesToRun = caseArg
  ? CASES.filter((c) => String(c.id) === caseArg)
  : CASES;
if (casesToRun.length === 0) {
  console.error(`[eval] no cases match --case=${caseArg}`);
  process.exit(2);
}

console.log(`[eval] Endpoint: ${AI_PROXY_URL}`);
console.log(`[eval] Cases: ${casesToRun.length}  Providers: ${PROVIDERS_TO_RUN.join(', ')}`);
console.log('');

const allResults = {};
let overallExitCode = 0;

for (const provider of PROVIDERS_TO_RUN) {
  const model = provider === 'anthropic' ? CLAUDE_MODEL : OPENAI_MODEL;
  console.log(`▶ ${provider} (${model})`);
  const results = await runProvider(provider, casesToRun);
  allResults[provider] = results;
  const fullPass = results.filter((r) => r.verdict.passed === r.verdict.total).length;
  console.log(`  → ${fullPass}/${results.length} full-pass`);
  console.log('');
  if (fullPass < results.length - 1) {
    overallExitCode = 1; // tolerate 1 failure, fail at 2+
  }
}

// Write report
const reportDir = join(projectRoot, '..', 'docs');
mkdirSync(reportDir, { recursive: true });
const reportPath = join(reportDir, 'EVAL_SYSTEM_AGENT_LATEST.md');
const report = makeReport(allResults);
writeFileSync(reportPath, report, 'utf8');
console.log(`[eval] report written to ${reportPath}`);
console.log('');
console.log(`[eval] exit code: ${overallExitCode}`);
process.exit(overallExitCode);
