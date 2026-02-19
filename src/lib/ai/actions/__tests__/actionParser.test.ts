import { describe, it, expect, vi } from 'vitest';
import { parseActionFromResponse, parseAllActionsFromResponse, stripActionBlock } from '../actionParser';

// Suppress console.warn during tests (expected for invalid inputs)
vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('parseActionFromResponse', () => {
  it('parses a valid log_meal action', () => {
    const text = `Hier ist dein Hähnchen mit Reis!

\`\`\`ACTION:log_meal
{"name":"Hähnchen mit Reis","type":"lunch","calories":755,"protein":55,"carbs":80,"fat":15}
\`\`\``;

    const result = parseActionFromResponse(text);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('log_meal');
    expect(result!.data.name).toBe('Hähnchen mit Reis');
    expect(result!.data.calories).toBe(755);
  });

  it('parses a valid log_workout action', () => {
    const text = `Gutes Training!

\`\`\`ACTION:log_workout
{"name":"Krafttraining","type":"strength","duration_minutes":60,"calories_burned":400}
\`\`\``;

    const result = parseActionFromResponse(text);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('log_workout');
    expect(result!.data.name).toBe('Krafttraining');
  });

  it('parses a valid log_body action', () => {
    const text = `Notiert!

\`\`\`ACTION:log_body
{"weight_kg":82.5,"body_fat_pct":16.5}
\`\`\``;

    const result = parseActionFromResponse(text);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('log_body');
    expect(result!.data.weight_kg).toBe(82.5);
  });

  it('parses a valid log_blood_pressure action', () => {
    const text = `Blutdruck notiert.

\`\`\`ACTION:log_blood_pressure
{"systolic":135,"diastolic":85,"pulse":72,"date":"2026-02-17","time":"08:00"}
\`\`\``;

    const result = parseActionFromResponse(text);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('log_blood_pressure');
    expect(result!.data.systolic).toBe(135);
    expect(result!.data.diastolic).toBe(85);
  });

  it('parses a valid log_substance action', () => {
    const text = `Einnahme geloggt.

\`\`\`ACTION:log_substance
{"substance_name":"Testosteron","dosage_taken":"250mg","site":"glute_left"}
\`\`\``;

    const result = parseActionFromResponse(text);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('log_substance');
    expect(result!.data.substance_name).toBe('Testosteron');
  });

  it('parses a valid save_training_plan action', () => {
    const text = `Hier ist dein Plan!

\`\`\`ACTION:save_training_plan
{"name":"Upper/Lower Split","split_type":"upper_lower","days_per_week":4,"days":[{"day_number":1,"name":"Lower A","exercises":[{"name":"Squat","sets":4,"reps":"8"}]}]}
\`\`\``;

    const result = parseActionFromResponse(text);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('save_training_plan');
    expect(result!.data.name).toBe('Upper/Lower Split');
  });

  // Error cases
  it('returns null when no ACTION block is present', () => {
    const text = 'Guten Tag! Wie kann ich dir helfen?';
    expect(parseActionFromResponse(text)).toBeNull();
  });

  it('returns null for unknown action type', () => {
    const text = `\`\`\`ACTION:unknown_action
{"foo":"bar"}
\`\`\``;
    expect(parseActionFromResponse(text)).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    const text = `\`\`\`ACTION:log_meal
{not valid json}
\`\`\``;
    expect(parseActionFromResponse(text)).toBeNull();
  });

  it('returns null when required fields are missing (log_meal without name)', () => {
    const text = `\`\`\`ACTION:log_meal
{"calories":500,"protein":30,"carbs":50,"fat":15}
\`\`\``;
    expect(parseActionFromResponse(text)).toBeNull();
  });

  it('returns null when required fields are missing (log_blood_pressure without systolic)', () => {
    const text = `\`\`\`ACTION:log_blood_pressure
{"diastolic":85,"date":"2026-01-01","time":"08:00"}
\`\`\``;
    expect(parseActionFromResponse(text)).toBeNull();
  });

  it('is case-insensitive for ACTION keyword', () => {
    const text = `\`\`\`action:log_meal
{"name":"Test","calories":100,"protein":10,"carbs":10,"fat":5}
\`\`\``;
    const result = parseActionFromResponse(text);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('log_meal');
  });

  it('returns only the first ACTION block when multiple exist (backwards compat)', () => {
    const text = `\`\`\`ACTION:log_meal
{"name":"First","calories":100,"protein":10,"carbs":10,"fat":5}
\`\`\`

\`\`\`ACTION:log_workout
{"name":"Second","type":"cardio"}
\`\`\``;
    const result = parseActionFromResponse(text);
    expect(result).not.toBeNull();
    expect(result!.data.name).toBe('First');
  });
});

describe('parseAllActionsFromResponse', () => {
  it('returns empty array when no ACTION blocks found', () => {
    const text = 'Hallo! Wie geht es dir?';
    const result = parseAllActionsFromResponse(text);
    expect(result).toEqual([]);
  });

  it('returns single action in array', () => {
    const text = `Gespeichert!

\`\`\`ACTION:log_meal
{"name":"Hähnchen","type":"lunch","calories":300,"protein":50,"carbs":0,"fat":8}
\`\`\``;

    const result = parseAllActionsFromResponse(text);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('log_meal');
    expect(result[0].data.name).toBe('Hähnchen');
  });

  it('parses MULTIPLE ACTION blocks from one response', () => {
    const text = `Hier sind deine Mahlzeiten:

Frühstück: Proteinshake — 150 kcal | 30g P
Mittagessen: Hähnchen mit Reis — 500 kcal | 48g P
Abendessen: Döner — 650 kcal | 35g P

Tages-Gesamt: ~1300 kcal | 113g P

\`\`\`ACTION:log_meal
{"name":"Proteinshake","type":"breakfast","calories":150,"protein":30,"carbs":8,"fat":2}
\`\`\`
\`\`\`ACTION:log_meal
{"name":"Hähnchen mit Reis","type":"lunch","calories":500,"protein":48,"carbs":55,"fat":8}
\`\`\`
\`\`\`ACTION:log_meal
{"name":"Döner","type":"dinner","calories":650,"protein":35,"carbs":55,"fat":30}
\`\`\``;

    const result = parseAllActionsFromResponse(text);
    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('log_meal');
    expect(result[0].data.name).toBe('Proteinshake');
    expect(result[1].type).toBe('log_meal');
    expect(result[1].data.name).toBe('Hähnchen mit Reis');
    expect(result[2].type).toBe('log_meal');
    expect(result[2].data.name).toBe('Döner');
  });

  it('parses mixed action types (meal + substance)', () => {
    const text = `Alles notiert.

\`\`\`ACTION:log_meal
{"name":"Shake","type":"breakfast","calories":150,"protein":30,"carbs":8,"fat":2}
\`\`\`
\`\`\`ACTION:log_substance
{"substance_name":"Testosteron","dosage_taken":"250mg","site":"glute_left"}
\`\`\``;

    const result = parseAllActionsFromResponse(text);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('log_meal');
    expect(result[1].type).toBe('log_substance');
  });

  it('skips invalid action blocks but includes valid ones', () => {
    const text = `Gemischt.

\`\`\`ACTION:log_meal
{"name":"Gültig","type":"lunch","calories":500,"protein":40,"carbs":50,"fat":10}
\`\`\`
\`\`\`ACTION:log_meal
{invalid json here}
\`\`\`
\`\`\`ACTION:log_meal
{"name":"Auch gültig","type":"dinner","calories":600,"protein":45,"carbs":60,"fat":15}
\`\`\``;

    const result = parseAllActionsFromResponse(text);
    expect(result).toHaveLength(2);
    expect(result[0].data.name).toBe('Gültig');
    expect(result[1].data.name).toBe('Auch gültig');
  });
});

describe('stripActionBlock', () => {
  it('removes the ACTION block from text', () => {
    const text = `Hier ist dein Essen!

\`\`\`ACTION:log_meal
{"name":"Test","calories":100,"protein":10,"carbs":10,"fat":5}
\`\`\``;

    const stripped = stripActionBlock(text);
    expect(stripped).toBe('Hier ist dein Essen!');
    expect(stripped).not.toContain('ACTION');
    expect(stripped).not.toContain('```');
  });

  it('returns original text when no ACTION block', () => {
    const text = 'Guten Tag!';
    expect(stripActionBlock(text)).toBe('Guten Tag!');
  });

  it('preserves text before and after the block', () => {
    const text = `Vorher.

\`\`\`ACTION:log_meal
{"name":"Test","calories":100,"protein":10,"carbs":10,"fat":5}
\`\`\`

Nachher.`;

    const stripped = stripActionBlock(text);
    expect(stripped).toContain('Vorher.');
    expect(stripped).toContain('Nachher.');
  });

  it('removes ALL action blocks from text', () => {
    const text = `Drei Mahlzeiten gespeichert!

\`\`\`ACTION:log_meal
{"name":"Shake","type":"breakfast","calories":150,"protein":30,"carbs":8,"fat":2}
\`\`\`
\`\`\`ACTION:log_meal
{"name":"Hähnchen","type":"lunch","calories":500,"protein":48,"carbs":55,"fat":8}
\`\`\`
\`\`\`ACTION:log_meal
{"name":"Döner","type":"dinner","calories":650,"protein":35,"carbs":55,"fat":30}
\`\`\``;

    const stripped = stripActionBlock(text);
    expect(stripped).toBe('Drei Mahlzeiten gespeichert!');
    expect(stripped).not.toContain('ACTION');
    expect(stripped).not.toContain('```');
  });
});
