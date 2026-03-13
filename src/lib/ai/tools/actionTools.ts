/**
 * OpenAI Function Calling tool definitions generated from Zod schemas.
 *
 * Converts the existing SCHEMA_MAP (Zod) into OpenAI-compatible tool definitions
 * using zod-to-json-schema. Handles .refine()/.transform() schemas gracefully
 * by extracting the inner ZodObject before conversion.
 *
 * @see https://platform.openai.com/docs/guides/function-calling
 */

import { z } from 'zod';
import type { ActionType } from '../actions/types';
import { actionRegistry } from '../actions/registry';
import type { ToolCall } from '../types';
export type { ToolCall };

// ── Types ──────────────────────────────────────────────────────────────

/** OpenAI Function Calling tool definition */
export interface ToolDefinition {
  type: `function`;
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    strict?: boolean;
  };
}

// ── Tool descriptions (German, matches UI) ────────────────────────────

const TOOL_DESCRIPTIONS: Record<ActionType, string> = {
  log_meal: 'Mahlzeit loggen. Erfasse Name, Kalorien, Makros (Protein, Kohlenhydrate, Fett). Nutze diese Funktion wenn der User sagt er hat etwas gegessen oder eine Mahlzeit aufnehmen will.',
  log_workout: 'Training loggen. Erfasse Trainingsname, Typ, Dauer und optional einzelne Uebungen mit Saetzen/Wiederholungen/Gewicht.',
  log_body: 'Koerperwerte loggen. Erfasse Gewicht, Koerperfettanteil, Muskelmasse oder Koerperumfaenge. Mindestens ein Messwert muss vorhanden sein.',
  log_blood_pressure: 'Blutdruck loggen. Erfasse systolischen und diastolischen Wert sowie optionalen Puls.',
  log_blood_work: 'Blutwerte loggen. Erfasse Laborergebnisse wie Testosteron, Haematokrit, Haemoglobin, Cholesterin, Leberwerte etc. Mindestens ein Wert muss vorhanden sein.',
  log_substance: 'Substanz-Einnahme loggen. Erfasse welche Substanz eingenommen wurde, Dosierung und optional die Injektionsstelle.',
  save_training_plan: 'Trainingsplan speichern. Erfasse Planname, Split-Typ, Tage pro Woche und die einzelnen Trainingstage mit Uebungen.',
  save_product: 'Neues Produkt/Lebensmittel speichern. Erfasse Naehrwerte pro Portion (Kalorien, Protein, Kohlenhydrate, Fett).',
  add_substance: 'Neue Substanz anlegen. Erfasse Name, Kategorie (TRT/PED/Medikament/Supplement), Verabreichungsart, Dosierung.',
  add_reminder: 'Erinnerung anlegen. Erfasse Titel, Typ, Tageszeit oder konkreten Zeitpunkt, Wiederholungsmodus.',
  update_profile: 'Profil aktualisieren. Aendere Koerpergroesse, Geburtsjahr, Geschlecht, Aktivitaetslevel oder Tagesziele.',
  update_equipment: 'Geraetepark aktualisieren. Setze die Liste der verfuegbaren Trainingsgeraete.',
  search_product: 'Produkt recherchieren. Suche nach Naehrwertinformationen fuer ein Lebensmittel.',
  restart_tour: 'Produkttour neu starten. Startet die gefuehrte Tour durch die App.',
  save_recipe: 'Rezept speichern. Erstellt ein neues Rezept mit Zutaten, Zubereitungsschritten und Naehrwerten.',
};

// ── Zod schemas (duplicated from schemas.ts to avoid .refine()/.transform() issues) ──
// We re-define the BASE shapes here without .refine()/.transform(),
// since those Zod features do NOT translate to JSON Schema.
// The actual validation still uses the schemas from schemas.ts.

const ToolSchemas: Record<ActionType, z.ZodObject<z.ZodRawShape>> = {
  log_meal: z.object({
    date: z.string().describe('Datum im Format YYYY-MM-DD. Default: heute.').optional(),
    name: z.string().describe('Name der Mahlzeit, z.B. Haehnchen mit Reis'),
    type: z.enum(['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'snack']).describe('Mahlzeittyp. Default: wird aus Uhrzeit abgeleitet.').optional(),
    calories: z.number().describe('Kalorien (kcal)'),
    protein: z.number().describe('Protein in Gramm'),
    carbs: z.number().describe('Kohlenhydrate in Gramm'),
    fat: z.number().describe('Fett in Gramm'),
    fiber: z.number().describe('Ballaststoffe in Gramm').optional(),
  }),

  log_workout: z.object({
    date: z.string().describe('Datum YYYY-MM-DD. Default: heute.').optional(),
    name: z.string().describe('Trainingsname, z.B. Push Day'),
    type: z.enum(['strength', 'cardio', 'flexibility', 'hiit', 'sports', 'other']).describe('Trainingstyp').optional(),
    duration_minutes: z.number().describe('Dauer in Minuten').optional(),
    calories_burned: z.number().describe('Kalorienverbrauch').optional(),
    exercises: z.array(z.object({
      name: z.string().describe('Uebungsname'),
      sets: z.number().describe('Anzahl Saetze').optional(),
      reps: z.number().describe('Wiederholungen pro Satz').optional(),
      weight_kg: z.number().describe('Gewicht in kg').optional(),
      duration_minutes: z.number().describe('Dauer bei Cardio-Uebungen').optional(),
    })).describe('Liste der Uebungen').optional(),
    notes: z.string().describe('Notizen').optional(),
  }),

  log_body: z.object({
    date: z.string().describe('Datum YYYY-MM-DD. Default: heute.').optional(),
    weight_kg: z.number().describe('Gewicht in kg').optional(),
    body_fat_pct: z.number().describe('Koerperfettanteil in Prozent').optional(),
    muscle_mass_kg: z.number().describe('Muskelmasse in kg').optional(),
    water_pct: z.number().describe('Wasseranteil in Prozent').optional(),
    waist_cm: z.number().describe('Taillenumfang in cm').optional(),
    chest_cm: z.number().describe('Brustumfang in cm').optional(),
    arm_cm: z.number().describe('Armumfang in cm').optional(),
    leg_cm: z.number().describe('Beinumfang in cm').optional(),
  }),

  log_blood_pressure: z.object({
    date: z.string().describe('Datum YYYY-MM-DD. Default: heute.').optional(),
    time: z.string().describe('Uhrzeit HH:MM. Default: jetzt.').optional(),
    systolic: z.number().describe('Systolischer Wert (oberer Wert) in mmHg'),
    diastolic: z.number().describe('Diastolischer Wert (unterer Wert) in mmHg'),
    pulse: z.number().describe('Puls/Herzfrequenz in bpm').optional(),
    notes: z.string().describe('Notizen').optional(),
  }),

  log_blood_work: z.object({
    date: z.string().describe('Datum YYYY-MM-DD. Default: heute.').optional(),
    // Hormones
    testosterone_total: z.number().describe('Gesamttestosteron ng/dL').optional(),
    testosterone_free: z.number().describe('Freies Testosteron pg/mL').optional(),
    estradiol: z.number().describe('Estradiol pg/mL').optional(),
    lh: z.number().describe('LH mIU/mL').optional(),
    fsh: z.number().describe('FSH mIU/mL').optional(),
    shbg: z.number().describe('SHBG nmol/L').optional(),
    prolactin: z.number().describe('Prolaktin ng/mL').optional(),
    cortisol: z.number().describe('Cortisol mcg/dL').optional(),
    free_androgen_index: z.number().describe('Freier Androgenindex').optional(),
    // Blood count
    hematocrit: z.number().describe('Haematokrit %').optional(),
    hemoglobin: z.number().describe('Haemoglobin g/dL').optional(),
    erythrocytes: z.number().describe('Erythrozyten Mio/mcL').optional(),
    leukocytes: z.number().describe('Leukozyten Tsd/mcL').optional(),
    platelets: z.number().describe('Thrombozyten Tsd/mcL').optional(),
    // Lipids
    hdl: z.number().describe('HDL mg/dL').optional(),
    ldl: z.number().describe('LDL mg/dL').optional(),
    triglycerides: z.number().describe('Triglyceride mg/dL').optional(),
    total_cholesterol: z.number().describe('Gesamtcholesterin mg/dL').optional(),
    // Liver
    ast: z.number().describe('AST (GOT) U/L').optional(),
    alt: z.number().describe('ALT (GPT) U/L').optional(),
    ggt: z.number().describe('GGT U/L').optional(),
    bilirubin: z.number().describe('Bilirubin mg/dL').optional(),
    alkaline_phosphatase: z.number().describe('Alkalische Phosphatase U/L').optional(),
    // Kidney
    creatinine: z.number().describe('Kreatinin mg/dL').optional(),
    egfr: z.number().describe('eGFR mL/min').optional(),
    urea: z.number().describe('Harnstoff mg/dL').optional(),
    // Metabolism
    fasting_glucose: z.number().describe('Nuechternglukose mg/dL').optional(),
    uric_acid: z.number().describe('Harnsaeure mg/dL').optional(),
    iron: z.number().describe('Eisen mcg/dL').optional(),
    total_protein: z.number().describe('Gesamteiweiss g/dL').optional(),
    hba1c: z.number().describe('HbA1c %').optional(),
    ferritin: z.number().describe('Ferritin ng/mL').optional(),
    // Electrolytes
    potassium: z.number().describe('Kalium mmol/L').optional(),
    sodium: z.number().describe('Natrium mmol/L').optional(),
    calcium: z.number().describe('Calcium mg/dL').optional(),
    // Other
    tsh: z.number().describe('TSH mIU/L').optional(),
    psa: z.number().describe('PSA ng/mL').optional(),
    free_psa: z.number().describe('Freies PSA ng/mL').optional(),
    vitamin_d: z.number().describe('Vitamin D ng/mL').optional(),
    notes: z.string().describe('Notizen').optional(),
  }),

  log_substance: z.object({
    substance_name: z.string().describe('Name der Substanz, z.B. Testosteron Enantat'),
    date: z.string().describe('Datum YYYY-MM-DD. Default: heute.').optional(),
    time: z.string().describe('Uhrzeit HH:MM. Default: jetzt.').optional(),
    dosage_taken: z.string().describe('Eingenommene Dosis, z.B. 250mg').optional(),
    site: z.enum(['glute_left', 'glute_right', 'delt_left', 'delt_right', 'quad_left', 'quad_right', 'ventro_glute_left', 'ventro_glute_right', 'abdomen', 'other']).describe('Injektionsstelle').optional(),
    notes: z.string().describe('Notizen').optional(),
  }),

  save_training_plan: z.object({
    name: z.string().describe('Name des Trainingsplans'),
    split_type: z.enum(['ppl', 'upper_lower', 'full_body', 'custom', 'running', 'swimming', 'cycling', 'yoga', 'martial_arts', 'mixed']).describe('Split-Typ').optional(),
    days_per_week: z.number().describe('Trainingstage pro Woche (1-7)'),
    notes: z.string().describe('Notizen zum Plan').optional(),
    days: z.array(z.object({
      day_number: z.number().describe('Tag-Nummer (1-7)'),
      name: z.string().describe('Tagesname, z.B. Push Day'),
      focus: z.string().describe('Trainingsfokus').optional(),
      exercises: z.array(z.object({
        name: z.string().describe('Uebungsname'),
        sets: z.number().describe('Saetze').optional(),
        reps: z.string().describe('Wiederholungen, z.B. 8-12').optional(),
        weight_kg: z.number().describe('Gewicht in kg').optional(),
        rest_seconds: z.number().describe('Pausenzeit in Sekunden').optional(),
        duration_minutes: z.number().describe('Dauer bei Cardio').optional(),
        distance_km: z.number().describe('Distanz in km').optional(),
        exercise_type: z.enum(['strength', 'cardio', 'flexibility', 'functional', 'other']).describe('Uebungstyp').optional(),
        notes: z.string().describe('Notizen').optional(),
      })),
      notes: z.string().describe('Notizen zum Tag').optional(),
    })),
  }),

  save_product: z.object({
    name: z.string().describe('Produktname'),
    brand: z.string().describe('Marke').optional(),
    category: z.enum(['grain', 'dairy', 'meat', 'fish', 'fruit', 'vegetable', 'snack', 'beverage', 'supplement', 'general']).describe('Kategorie').optional(),
    serving_size_g: z.number().describe('Portionsgroesse in Gramm'),
    serving_label: z.string().describe('Portionsbezeichnung, z.B. 1 Stueck').optional(),
    calories_per_serving: z.number().describe('Kalorien pro Portion'),
    protein_per_serving: z.number().describe('Protein pro Portion in Gramm'),
    carbs_per_serving: z.number().describe('Kohlenhydrate pro Portion in Gramm'),
    fat_per_serving: z.number().describe('Fett pro Portion in Gramm'),
    fiber_per_serving: z.number().describe('Ballaststoffe pro Portion in Gramm').optional(),
    notes: z.string().describe('Notizen').optional(),
  }),

  add_substance: z.object({
    name: z.string().describe('Name der Substanz'),
    category: z.enum(['trt', 'ped', 'medication', 'supplement', 'other']).describe('Kategorie').optional(),
    type: z.enum(['injection', 'oral', 'transdermal', 'subcutaneous', 'other']).describe('Verabreichungsart').optional(),
    dosage: z.string().describe('Dosierung, z.B. 250mg').optional(),
    unit: z.string().describe('Einheit, z.B. mg').optional(),
    frequency: z.string().describe('Haeufigkeit, z.B. 2x pro Woche').optional(),
    ester: z.string().describe('Ester, z.B. Enantat').optional(),
    half_life_days: z.number().describe('Halbwertszeit in Tagen').optional(),
    notes: z.string().describe('Notizen').optional(),
  }),

  add_reminder: z.object({
    title: z.string().describe('Titel der Erinnerung'),
    type: z.enum(['substance', 'blood_pressure', 'body_measurement', 'custom']).describe('Typ der Erinnerung').optional(),
    time_period: z.enum(['morning', 'noon', 'evening']).describe('Tageszeit').optional(),
    time: z.string().describe('Konkrete Uhrzeit HH:MM').optional(),
    repeat_mode: z.enum(['weekly', 'interval']).describe('Wiederholungsmodus').optional(),
    days_of_week: z.array(z.number()).describe('Wochentage (0=So, 1=Mo, ..., 6=Sa)').optional(),
    interval_days: z.number().describe('Intervall in Tagen (nur bei repeat_mode=interval)').optional(),
    substance_name: z.string().describe('Zugehoerige Substanz').optional(),
    description: z.string().describe('Beschreibung').optional(),
  }),

  update_profile: z.object({
    height_cm: z.number().describe('Koerpergroesse in cm').optional(),
    birth_year: z.number().describe('Geburtsjahr').optional(),
    gender: z.enum(['male', 'female', 'other']).describe('Geschlecht').optional(),
    activity_level: z.number().describe('Aktivitaetslevel PAL (1.0-2.5)').optional(),
    display_name: z.string().describe('Anzeigename').optional(),
    daily_calories_goal: z.number().describe('Tagesziel Kalorien').optional(),
    daily_protein_goal: z.number().describe('Tagesziel Protein in Gramm').optional(),
  }),

  update_equipment: z.object({
    equipment_names: z.array(z.string()).describe('Liste der verfuegbaren Geraete'),
    gym_profile_name: z.string().describe('Name des Gym-Profils').optional(),
  }),

  search_product: z.object({
    query: z.string().describe('Suchbegriff fuer das Produkt'),
    portion_g: z.number().describe('Portionsgroesse in Gramm').optional(),
    meal_type: z.enum(['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'snack']).describe('Mahlzeittyp').optional(),
  }),

  restart_tour: z.object({}),

  save_recipe: z.object({
    title: z.string().describe('Name des Rezepts'),
    description: z.string().describe('Kurze Beschreibung').optional(),
    meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout']).describe('Mahlzeittyp').nullable().optional(),
    servings: z.number().describe('Anzahl Portionen').optional(),
    prep_time_min: z.number().describe('Vorbereitungszeit in Minuten').optional(),
    cook_time_min: z.number().describe('Kochzeit in Minuten').optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).describe('Schwierigkeitsgrad').optional(),
    calories_per_serving: z.number().describe('Kalorien pro Portion').optional(),
    protein_per_serving: z.number().describe('Protein pro Portion in g').optional(),
    carbs_per_serving: z.number().describe('Kohlenhydrate pro Portion in g').optional(),
    fat_per_serving: z.number().describe('Fett pro Portion in g').optional(),
    ingredients: z.array(z.object({
      name: z.string().describe('Zutatname'),
      amount: z.number().describe('Menge'),
      unit: z.string().describe('Einheit (g, ml, EL, TL, Stueck)').optional(),
    })).describe('Zutaten-Liste').optional(),
    steps: z.array(z.object({
      text: z.string().describe('Zubereitungsschritt'),
      duration_min: z.number().describe('Dauer in Minuten').optional(),
    })).describe('Zubereitungsschritte').optional(),
    tags: z.array(z.string()).describe('Tags wie High-Protein, Low-Carb').optional(),
  }),
};

// ── Tool generation ────────────────────────────────────────────────────

/**
 * Convert a single Zod schema to an OpenAI tool definition.
 */
function schemaToTool(name: ActionType, schema: z.ZodObject<z.ZodRawShape>): ToolDefinition {
  // Use Zod v4 built-in toJSONSchema() instead of zod-to-json-schema (incompatible with Zod v4)
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;

  // Remove $schema from top level (OpenAI does not need it)
  const { $schema, ...params } = jsonSchema;

  return {
    type: 'function',
    function: {
      name,
      description: TOOL_DESCRIPTIONS[name],
      parameters: params,
    },
  };
}

/** All action tools for OpenAI Function Calling */
let _cachedTools: ToolDefinition[] | null = null;

/**
 * Get all action tool definitions for passing to OpenAI.
 * Uses ActionRegistry as primary source, falls back to static ToolSchemas.
 * Results are cached since schemas are static.
 */
export function getActionTools(): ToolDefinition[] {
  if (_cachedTools) return _cachedTools;

  // Try registry first (Phase 1 ActionRegistry)
  const registrySchemas = actionRegistry.getAllToolSchemas();
  const registryDescriptions = actionRegistry.getAllToolDescriptions();

  if (Object.keys(registrySchemas).length > 0) {
    _cachedTools = Object.entries(registrySchemas).map(([name, schema]) => {
      const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
      const { $schema, ...params } = jsonSchema;
      return {
        type: 'function' as const,
        function: {
          name,
          description: registryDescriptions[name] ?? TOOL_DESCRIPTIONS[name as ActionType] ?? '',
          parameters: params,
        },
      };
    });
  } else {
    // Fallback to static schemas
    _cachedTools = (Object.entries(ToolSchemas) as [ActionType, z.ZodObject<z.ZodRawShape>][])
      .map(([name, schema]) => schemaToTool(name, schema));
  }

  return _cachedTools;
}

/**
 * Get tool definitions for a specific subset of action types.
 * Useful for restricting which actions the System-Agent can invoke.
 */
export function getActionToolsForTypes(types: ActionType[]): ToolDefinition[] {
  return getActionTools().filter(tool => types.includes(tool.function.name as ActionType));
}

/**
 * Parse tool_calls from an OpenAI response into ParsedAction-compatible format.
 * Returns an array of { type, data } objects ready for validation via schemas.ts.
 */
export function parseToolCalls(toolCalls: ToolCall[]): Array<{ type: ActionType; data: Record<string, unknown>; rawJson: string }> {
  return toolCalls
    .filter(tc => tc.type === `function`)
    .map(tc => {
      const name = tc.function.name as ActionType;
      const rawJson = tc.function.arguments;
      try {
        const data = JSON.parse(rawJson) as Record<string, unknown>;
        return { type: name, data, rawJson };
      } catch {
        console.error('[actionTools] Failed to parse tool_call arguments:', rawJson.slice(0, 200));
        return null;
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}
