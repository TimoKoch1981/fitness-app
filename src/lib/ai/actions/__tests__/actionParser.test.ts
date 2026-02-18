import { describe, it, expect, vi } from 'vitest';
import { parseActionFromResponse, stripActionBlock } from '../actionParser';

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

  it('only parses the first ACTION block if multiple exist', () => {
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
});
