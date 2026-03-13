/**
 * Default action registrations — registers all 17 actions in the ActionRegistry.
 *
 * Called once at app startup (main.tsx) before React renders.
 * Each registration bundles schema, display, execute, and toolDescription
 * into a single ActionDescriptor — eliminating the need for scattered switch-cases.
 *
 * @see docs/KONZEPT_ACTION_REGISTRY.md — Phase 1
 */

import { z } from 'zod';
import { actionRegistry, fuzzyMatchSubstance } from './registry';
import type { ExecutionContext } from './registry';
import {
  LogMealSchema,
  LogWorkoutSchema,
  LogBodySchema,
  LogBloodPressureSchema,
  LogBloodWorkSchema,
  LogSubstanceSchema,
  SaveTrainingPlanSchema,
  AddTrainingDaySchema,
  ModifyTrainingDaySchema,
  RemoveTrainingDaySchema,
  SaveProductSchema,
  AddSubstanceSchema,
  AddReminderSchema,
  UpdateProfileSchema,
  UpdateEquipmentSchema,
  SearchProductSchema,
  RestartTourSchema,
} from './schemas';
import type { ActionType } from './types';
import type {
  SplitType,
  PlanExercise,
  InjectionSite,
  ProductCategory,
  SubstanceCategory,
  SubstanceAdminType,
  ReminderType,
  RepeatMode,
  TimePeriod,
  Gender,
} from '../../../types/health';

// ── Biomarker keys for log_blood_work ────────────────────────────────────

const BLOOD_WORK_MARKER_KEYS = [
  'testosterone_total', 'testosterone_free', 'estradiol', 'lh', 'fsh', 'shbg', 'prolactin',
  'cortisol', 'free_androgen_index',
  'hematocrit', 'hemoglobin', 'erythrocytes', 'leukocytes', 'platelets',
  'hdl', 'ldl', 'triglycerides', 'total_cholesterol',
  'ast', 'alt', 'ggt', 'bilirubin', 'alkaline_phosphatase',
  'creatinine', 'egfr', 'urea',
  'fasting_glucose', 'uric_acid', 'iron', 'total_protein', 'hba1c', 'ferritin',
  'potassium', 'sodium', 'calcium',
  'tsh', 'psa', 'free_psa', 'vitamin_d',
] as const;

// ── Tool Schemas (simplified, no .refine/.transform) ─────────────────────
// Duplicated from actionTools.ts — these are the LLM-facing schemas
// without Zod transforms that don't translate to JSON Schema.

const ToolSchemaMap: Partial<Record<ActionType, z.ZodObject<z.ZodRawShape>>> = {
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
    testosterone_total: z.number().describe('Gesamttestosteron ng/dL').optional(),
    testosterone_free: z.number().describe('Freies Testosteron pg/mL').optional(),
    estradiol: z.number().describe('Estradiol pg/mL').optional(),
    lh: z.number().describe('LH mIU/mL').optional(),
    fsh: z.number().describe('FSH mIU/mL').optional(),
    shbg: z.number().describe('SHBG nmol/L').optional(),
    prolactin: z.number().describe('Prolaktin ng/mL').optional(),
    cortisol: z.number().describe('Cortisol mcg/dL').optional(),
    free_androgen_index: z.number().describe('Freier Androgenindex').optional(),
    hematocrit: z.number().describe('Haematokrit %').optional(),
    hemoglobin: z.number().describe('Haemoglobin g/dL').optional(),
    erythrocytes: z.number().describe('Erythrozyten Mio/mcL').optional(),
    leukocytes: z.number().describe('Leukozyten Tsd/mcL').optional(),
    platelets: z.number().describe('Thrombozyten Tsd/mcL').optional(),
    hdl: z.number().describe('HDL mg/dL').optional(),
    ldl: z.number().describe('LDL mg/dL').optional(),
    triglycerides: z.number().describe('Triglyceride mg/dL').optional(),
    total_cholesterol: z.number().describe('Gesamtcholesterin mg/dL').optional(),
    ast: z.number().describe('AST (GOT) U/L').optional(),
    alt: z.number().describe('ALT (GPT) U/L').optional(),
    ggt: z.number().describe('GGT U/L').optional(),
    bilirubin: z.number().describe('Bilirubin mg/dL').optional(),
    alkaline_phosphatase: z.number().describe('Alkalische Phosphatase U/L').optional(),
    creatinine: z.number().describe('Kreatinin mg/dL').optional(),
    egfr: z.number().describe('eGFR mL/min').optional(),
    urea: z.number().describe('Harnstoff mg/dL').optional(),
    fasting_glucose: z.number().describe('Nuechternglukose mg/dL').optional(),
    uric_acid: z.number().describe('Harnsaeure mg/dL').optional(),
    iron: z.number().describe('Eisen mcg/dL').optional(),
    total_protein: z.number().describe('Gesamteiweiss g/dL').optional(),
    hba1c: z.number().describe('HbA1c %').optional(),
    ferritin: z.number().describe('Ferritin ng/mL').optional(),
    potassium: z.number().describe('Kalium mmol/L').optional(),
    sodium: z.number().describe('Natrium mmol/L').optional(),
    calcium: z.number().describe('Calcium mg/dL').optional(),
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
};

// ── Registration ─────────────────────────────────────────────────────────

export function registerDefaultActions(): void {
  // ── log_meal ───────────────────────────────────────────────────────────
  actionRegistry.register({
    type: 'log_meal',
    schema: LogMealSchema,
    display: {
      icon: '🍽️',
      titleDE: 'Mahlzeit speichern?',
      titleEN: 'Save meal?',
      summary: (d) => `${d.name ?? 'Mahlzeit'} — ${d.calories ?? '?'} kcal | ${d.protein ?? '?'}g P`,
    },
    execute: async (d: Record<string, unknown>, ctx: ExecutionContext) => {
      await ctx.mutations.addMeal.mutateAsync({
        name: d.name as string,
        type: d.type as 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'snack',
        calories: d.calories as number,
        protein: d.protein as number,
        carbs: d.carbs as number,
        fat: d.fat as number,
        fiber: d.fiber as number | undefined,
        date: d.date as string | undefined,
        source: 'ai',
        user_id: ctx.userId,
      });
    },
    toolDescription: 'Mahlzeit loggen. Erfasse Name, Kalorien, Makros (Protein, Kohlenhydrate, Fett). Nutze diese Funktion wenn der User sagt er hat etwas gegessen oder eine Mahlzeit aufnehmen will.',
    toolSchema: ToolSchemaMap.log_meal,
    agentHint: 'nutrition',
  });

  // ── log_workout ────────────────────────────────────────────────────────
  actionRegistry.register({
    type: 'log_workout',
    schema: LogWorkoutSchema,
    display: {
      icon: '💪',
      titleDE: 'Training speichern?',
      titleEN: 'Save workout?',
      summary: (d) => `${d.name ?? 'Workout'}${d.duration_minutes ? ` — ${d.duration_minutes} Min` : ''}`,
    },
    execute: async (d: Record<string, unknown>, ctx: ExecutionContext) => {
      await ctx.mutations.addWorkout.mutateAsync({
        name: d.name as string,
        type: d.type as 'strength' | 'cardio' | 'flexibility' | 'hiit' | 'sports' | 'other',
        duration_minutes: d.duration_minutes as number | undefined,
        calories_burned: d.calories_burned as number | undefined,
        met_value: d.met_value as number | undefined,
        exercises: d.exercises as Array<{ name: string; sets?: number; reps?: number; weight_kg?: number }> | undefined,
        notes: d.notes as string | undefined,
        date: d.date as string | undefined,
        user_id: ctx.userId,
      });
    },
    toolDescription: 'Training loggen. Erfasse Trainingsname, Typ, Dauer und optional einzelne Uebungen mit Saetzen/Wiederholungen/Gewicht.',
    toolSchema: ToolSchemaMap.log_workout,
    agentHint: 'training',
  });

  // ── log_body ───────────────────────────────────────────────────────────
  actionRegistry.register({
    type: 'log_body',
    schema: LogBodySchema,
    display: {
      icon: '⚖️',
      titleDE: 'Körperwerte speichern?',
      titleEN: 'Save body measurements?',
      summary: (d) => [
        d.weight_kg ? `${d.weight_kg} kg` : null,
        d.body_fat_pct ? `${d.body_fat_pct}% KFA` : null,
      ].filter(Boolean).join(', ') || 'Körpermessung',
    },
    execute: async (d: Record<string, unknown>, ctx: ExecutionContext) => {
      await ctx.mutations.addBodyMeasurement.mutateAsync({
        weight_kg: d.weight_kg as number | undefined,
        body_fat_pct: d.body_fat_pct as number | undefined,
        muscle_mass_kg: d.muscle_mass_kg as number | undefined,
        water_pct: d.water_pct as number | undefined,
        waist_cm: d.waist_cm as number | undefined,
        chest_cm: d.chest_cm as number | undefined,
        arm_cm: d.arm_cm as number | undefined,
        leg_cm: d.leg_cm as number | undefined,
        date: d.date as string | undefined,
        source: 'ai',
        user_id: ctx.userId,
      });
    },
    toolDescription: 'Koerperwerte loggen. Erfasse Gewicht, Koerperfettanteil, Muskelmasse oder Koerperumfaenge. Mindestens ein Messwert muss vorhanden sein.',
    toolSchema: ToolSchemaMap.log_body,
    agentHint: 'analysis',
  });

  // ── log_blood_pressure ─────────────────────────────────────────────────
  actionRegistry.register({
    type: 'log_blood_pressure',
    schema: LogBloodPressureSchema,
    display: {
      icon: '❤️',
      titleDE: 'Blutdruck speichern?',
      titleEN: 'Save blood pressure?',
      summary: (d) => `${d.systolic ?? '?'}/${d.diastolic ?? '?'} mmHg${d.pulse ? ` | Puls ${d.pulse}` : ''}`,
    },
    execute: async (d: Record<string, unknown>, ctx: ExecutionContext) => {
      await ctx.mutations.addBloodPressure.mutateAsync({
        systolic: d.systolic as number,
        diastolic: d.diastolic as number,
        pulse: d.pulse as number | undefined,
        date: d.date as string,
        time: d.time as string,
        notes: d.notes as string | undefined,
        user_id: ctx.userId,
      });
    },
    toolDescription: 'Blutdruck loggen. Erfasse systolischen und diastolischen Wert sowie optionalen Puls.',
    toolSchema: ToolSchemaMap.log_blood_pressure,
    agentHint: 'medical',
  });

  // ── log_blood_work ─────────────────────────────────────────────────────
  actionRegistry.register({
    type: 'log_blood_work',
    schema: LogBloodWorkSchema,
    display: {
      icon: '🩸',
      titleDE: 'Blutwerte speichern?',
      titleEN: 'Save blood work?',
      summary: (d) => [
        d.testosterone_total ? `Test ${d.testosterone_total} ng/dL` : null,
        d.hematocrit ? `HCT ${d.hematocrit}%` : null,
        d.hemoglobin ? `Hb ${d.hemoglobin}` : null,
        d.hdl ? `HDL ${d.hdl}` : null,
        d.ldl ? `LDL ${d.ldl}` : null,
        d.alt ? `ALT ${d.alt}` : null,
        d.creatinine ? `Krea ${d.creatinine}` : null,
        d.fasting_glucose ? `Gluc ${d.fasting_glucose}` : null,
        d.iron ? `Fe ${d.iron}` : null,
        d.cortisol ? `Cort ${d.cortisol}` : null,
        d.tsh ? `TSH ${d.tsh}` : null,
        d.hba1c ? `HbA1c ${d.hba1c}%` : null,
        d.vitamin_d ? `VitD ${d.vitamin_d}` : null,
      ].filter(Boolean).slice(0, 5).join(', ') || 'Blutwerte',
    },
    execute: async (d: Record<string, unknown>, ctx: ExecutionContext) => {
      const bwInput: Record<string, unknown> = {
        date: d.date as string | undefined,
        notes: d.notes as string | undefined,
        user_id: ctx.userId,
      };
      for (const key of BLOOD_WORK_MARKER_KEYS) {
        if (d[key] != null) bwInput[key] = d[key] as number;
      }
      await ctx.mutations.addBloodWork.mutateAsync(bwInput as Parameters<typeof ctx.mutations.addBloodWork.mutateAsync>[0]);
    },
    toolDescription: 'Blutwerte loggen. Erfasse Laborergebnisse wie Testosteron, Haematokrit, Haemoglobin, Cholesterin, Leberwerte etc. Mindestens ein Wert muss vorhanden sein.',
    toolSchema: ToolSchemaMap.log_blood_work,
    agentHint: 'medical',
  });

  // ── log_substance ──────────────────────────────────────────────────────
  actionRegistry.register({
    type: 'log_substance',
    schema: LogSubstanceSchema,
    display: {
      icon: '💊',
      titleDE: 'Einnahme loggen?',
      titleEN: 'Log intake?',
      summary: (d) => `${d.substance_name ?? 'Substanz'}${d.dosage_taken ? ` — ${d.dosage_taken}` : ''}`,
    },
    execute: async (d: Record<string, unknown>, ctx: ExecutionContext) => {
      // Resolve substance_name → substance_id (fuzzy matching)
      const match = ctx.activeSubstances
        ? fuzzyMatchSubstance(d.substance_name as string, ctx.activeSubstances)
        : null;

      if (!match) {
        throw new Error(
          `Substance "${d.substance_name}" not found / Substanz "${d.substance_name}" nicht gefunden. ` +
          `Add it first under Substances / Zuerst unter Substanzen hinzufügen.`
        );
      }

      await ctx.mutations.logSubstance.mutateAsync({
        substance_id: match.id,
        dosage_taken: d.dosage_taken as string | undefined,
        site: d.site as InjectionSite | undefined,
        date: d.date as string | undefined,
        time: d.time as string | undefined,
        notes: d.notes as string | undefined,
        user_id: ctx.userId,
      });
    },
    toolDescription: 'Substanz-Einnahme loggen. Erfasse welche Substanz eingenommen wurde, Dosierung und optional die Injektionsstelle.',
    toolSchema: ToolSchemaMap.log_substance,
    agentHint: 'medical',
  });

  // ── save_training_plan ─────────────────────────────────────────────────
  actionRegistry.register({
    type: 'save_training_plan',
    schema: SaveTrainingPlanSchema,
    display: {
      icon: '📋',
      titleDE: 'Trainingsplan speichern?',
      titleEN: 'Save training plan?',
      summary: (d) => `${d.name ?? 'Plan'} — ${(d.days as unknown[])?.length ?? '?'} Tage`,
    },
    execute: async (d: Record<string, unknown>, ctx: ExecutionContext) => {
      await ctx.mutations.addTrainingPlan.mutateAsync({
        name: d.name as string,
        split_type: (d.split_type as SplitType) ?? 'custom',
        days_per_week: d.days_per_week as number,
        notes: d.notes as string | undefined,
        days: (d.days as Array<{ day_number: number; name: string; focus?: string; exercises: PlanExercise[]; notes?: string }>).map((day) => ({
          day_number: day.day_number as number,
          name: day.name as string,
          focus: day.focus as string | undefined,
          exercises: day.exercises as PlanExercise[],
          notes: day.notes as string | undefined,
        })),
        user_id: ctx.userId,
      });
    },
    toolDescription: 'Trainingsplan speichern. Erfasse Planname, Split-Typ, Tage pro Woche und die einzelnen Trainingstage mit Uebungen.',
    toolSchema: ToolSchemaMap.save_training_plan,
    agentHint: 'training',
  });

  // ── add_training_day ───────────────────────────────────────────────────
  actionRegistry.register({
    type: 'add_training_day',
    schema: AddTrainingDaySchema,
    display: {
      icon: '📅',
      titleDE: 'Trainingstag hinzufügen?',
      titleEN: 'Add training day?',
      summary: (d) => `Tag ${d.day_number ?? '?'}: ${d.name ?? 'Neuer Tag'} — ${(d.exercises as unknown[])?.length ?? '?'} Übungen`,
    },
    execute: async (d: Record<string, unknown>, ctx: ExecutionContext) => {
      await ctx.mutations.addTrainingPlanDay.mutateAsync({
        day_number: d.day_number as number,
        name: d.name as string,
        focus: d.focus as string | undefined,
        exercises: d.exercises as PlanExercise[],
        notes: d.notes as string | undefined,
        user_id: ctx.userId,
      });
    },
    toolDescription: 'Trainingstag zum aktiven Plan hinzufuegen. Erfasse Tag-Nummer, Name, Fokus und Uebungen.',
    toolSchema: ToolSchemaMap.save_training_plan, // Reuse plan schema structure
    agentHint: 'training',
  });

  // ── modify_training_day ────────────────────────────────────────────────
  actionRegistry.register({
    type: 'modify_training_day',
    schema: ModifyTrainingDaySchema,
    display: {
      icon: '✏️',
      titleDE: 'Trainingstag anpassen?',
      titleEN: 'Modify training day?',
      summary: (d) => `Tag ${d.day_number ?? '?'}${d.name ? `: ${d.name}` : ''} — ${(d.exercises as unknown[])?.length ?? '?'} Übungen`,
    },
    execute: async (d: Record<string, unknown>, ctx: ExecutionContext) => {
      await ctx.mutations.modifyTrainingPlanDay.mutateAsync({
        day_number: d.day_number as number,
        name: d.name as string | undefined,
        focus: d.focus as string | undefined,
        exercises: d.exercises as PlanExercise[],
        notes: d.notes as string | undefined,
        user_id: ctx.userId,
      });
    },
    toolDescription: 'Bestehenden Trainingstag im aktiven Plan aendern. Erfasse Tag-Nummer und neue Uebungen.',
    agentHint: 'training',
  });

  // ── remove_training_day ────────────────────────────────────────────────
  actionRegistry.register({
    type: 'remove_training_day',
    schema: RemoveTrainingDaySchema,
    display: {
      icon: '🗑️',
      titleDE: 'Trainingstag entfernen?',
      titleEN: 'Remove training day?',
      summary: (d) => `Tag ${d.day_number ?? '?'}${d.day_name ? `: ${d.day_name}` : ''}`,
    },
    execute: async (d: Record<string, unknown>, ctx: ExecutionContext) => {
      await ctx.mutations.removeTrainingPlanDay.mutateAsync({
        day_number: d.day_number as number,
        user_id: ctx.userId,
      });
    },
    toolDescription: 'Trainingstag aus dem aktiven Plan entfernen. Erfasse die Tag-Nummer.',
    agentHint: 'training',
  });

  // ── save_product ───────────────────────────────────────────────────────
  actionRegistry.register({
    type: 'save_product',
    schema: SaveProductSchema,
    display: {
      icon: '📦',
      titleDE: 'Produkt speichern?',
      titleEN: 'Save product?',
      summary: (d) => `${d.name ?? 'Produkt'} — ${d.serving_size_g ?? '?'}g — ${d.calories_per_serving ?? '?'} kcal | ${d.protein_per_serving ?? '?'}g P`,
    },
    execute: async (d: Record<string, unknown>, ctx: ExecutionContext) => {
      await ctx.mutations.addUserProduct.mutateAsync({
        name: d.name as string,
        brand: d.brand as string | undefined,
        category: (d.category as ProductCategory) ?? 'general',
        serving_size_g: d.serving_size_g as number,
        serving_label: d.serving_label as string | undefined,
        calories_per_serving: d.calories_per_serving as number,
        protein_per_serving: d.protein_per_serving as number,
        carbs_per_serving: d.carbs_per_serving as number,
        fat_per_serving: d.fat_per_serving as number,
        fiber_per_serving: d.fiber_per_serving as number | undefined,
        aliases: d.aliases as string[] | undefined,
        notes: d.notes as string | undefined,
        user_id: ctx.userId,
      });
    },
    toolDescription: 'Neues Produkt/Lebensmittel speichern. Erfasse Naehrwerte pro Portion (Kalorien, Protein, Kohlenhydrate, Fett).',
    toolSchema: ToolSchemaMap.save_product,
    agentHint: 'nutrition',
  });

  // ── add_substance ──────────────────────────────────────────────────────
  actionRegistry.register({
    type: 'add_substance',
    schema: AddSubstanceSchema,
    display: {
      icon: '💊',
      titleDE: 'Substanz anlegen?',
      titleEN: 'Add substance?',
      summary: (d) => `${d.name ?? 'Substanz'}${d.dosage ? ` — ${d.dosage}${d.unit ?? ''}` : ''} (${d.category ?? 'Sonstige'})`,
    },
    execute: async (d: Record<string, unknown>, ctx: ExecutionContext) => {
      await ctx.mutations.addSubstance.mutateAsync({
        name: d.name as string,
        category: (d.category as SubstanceCategory) ?? 'other',
        type: (d.type as SubstanceAdminType) ?? 'other',
        dosage: d.dosage as string | undefined,
        unit: d.unit as string | undefined,
        frequency: d.frequency as string | undefined,
        ester: d.ester as string | undefined,
        half_life_days: d.half_life_days as number | undefined,
        notes: d.notes as string | undefined,
      });
    },
    toolDescription: 'Neue Substanz anlegen. Erfasse Name, Kategorie (TRT/PED/Medikament/Supplement), Verabreichungsart, Dosierung.',
    toolSchema: ToolSchemaMap.add_substance,
    agentHint: 'medical',
  });

  // ── add_reminder ───────────────────────────────────────────────────────
  actionRegistry.register({
    type: 'add_reminder',
    schema: AddReminderSchema,
    display: {
      icon: '🔔',
      titleDE: 'Erinnerung anlegen?',
      titleEN: 'Add reminder?',
      summary: (d) => `${d.title ?? 'Erinnerung'}${d.time_period ? ` — ${d.time_period}` : ''}${d.repeat_mode === 'interval' && d.interval_days ? ` — alle ${d.interval_days} Tage` : ''}`,
    },
    execute: async (d: Record<string, unknown>, ctx: ExecutionContext) => {
      // If substance_name is provided, resolve to substance_id
      let substanceId: string | undefined;
      if (d.substance_name) {
        const match = ctx.activeSubstances
          ? fuzzyMatchSubstance(d.substance_name as string, ctx.activeSubstances)
          : null;
        if (match) {
          substanceId = match.id;
        }
      }

      await ctx.mutations.addReminder.mutateAsync({
        type: (d.type as ReminderType) ?? 'custom',
        title: d.title as string,
        description: d.description as string | undefined,
        time: d.time as string | undefined,
        time_period: d.time_period as TimePeriod | undefined,
        repeat_mode: (d.repeat_mode as RepeatMode) ?? 'weekly',
        days_of_week: d.days_of_week as number[] | undefined,
        interval_days: d.interval_days as number | undefined,
        substance_id: substanceId,
      });
    },
    toolDescription: 'Erinnerung anlegen. Erfasse Titel, Typ, Tageszeit oder konkreten Zeitpunkt, Wiederholungsmodus.',
    toolSchema: ToolSchemaMap.add_reminder,
    agentHint: 'medical',
  });

  // ── update_profile ─────────────────────────────────────────────────────
  actionRegistry.register({
    type: 'update_profile',
    schema: UpdateProfileSchema,
    display: {
      icon: '👤',
      titleDE: 'Profil aktualisieren?',
      titleEN: 'Update profile?',
      summary: (d) => [
        d.height_cm ? `${d.height_cm} cm` : null,
        d.birth_year ? `Jg. ${d.birth_year}` : null,
        d.gender ? `${d.gender}` : null,
        d.activity_level ? `PAL ${d.activity_level}` : null,
      ].filter(Boolean).join(', ') || 'Profil-Update',
    },
    execute: async (d: Record<string, unknown>, ctx: ExecutionContext) => {
      // Convert birth_year to birth_date (YYYY-01-01) for the DB
      const profileUpdate: Record<string, unknown> = {};
      if (d.height_cm != null) profileUpdate.height_cm = d.height_cm as number;
      if (d.gender != null) profileUpdate.gender = d.gender as Gender;
      if (d.activity_level != null) profileUpdate.activity_level = d.activity_level as number;
      if (d.display_name != null) profileUpdate.display_name = d.display_name as string;
      if (d.daily_calories_goal != null) profileUpdate.daily_calories_goal = d.daily_calories_goal as number;
      if (d.daily_protein_goal != null) profileUpdate.daily_protein_goal = d.daily_protein_goal as number;
      if (d.birth_year != null) {
        profileUpdate.birth_date = `${d.birth_year}-01-01`;
      }

      await ctx.mutations.updateProfile.mutateAsync(profileUpdate as Parameters<typeof ctx.mutations.updateProfile.mutateAsync>[0]);
    },
    toolDescription: 'Profil aktualisieren. Aendere Koerpergroesse, Geburtsjahr, Geschlecht, Aktivitaetslevel oder Tagesziele.',
    toolSchema: ToolSchemaMap.update_profile,
    agentHint: 'general',
  });

  // ── update_equipment ───────────────────────────────────────────────────
  actionRegistry.register({
    type: 'update_equipment',
    schema: UpdateEquipmentSchema,
    display: {
      icon: '🏋️',
      titleDE: 'Gerätepark aktualisieren?',
      titleEN: 'Update equipment?',
      summary: (d) => `${(d.equipment_names as string[])?.length ?? '?'} Geräte`,
    },
    execute: async (d: Record<string, unknown>, ctx: ExecutionContext) => {
      // Resolve equipment_names → equipment_ids via fuzzy matching against catalog
      const names = d.equipment_names as string[];
      if (!ctx.equipmentCatalog || ctx.equipmentCatalog.length === 0) {
        throw new Error('Equipment catalog not loaded / Geräte-Katalog nicht geladen.');
      }

      const resolvedIds: string[] = [];
      const notFound: string[] = [];

      for (const name of names) {
        const searchLower = name.toLowerCase().trim();
        // Try exact match first
        const exact = ctx.equipmentCatalog.find(e =>
          e.name.toLowerCase() === searchLower ||
          (e.name_en?.toLowerCase() ?? '') === searchLower
        );
        if (exact) {
          resolvedIds.push(exact.id);
          continue;
        }
        // Partial match
        const partial = ctx.equipmentCatalog.find(e =>
          e.name.toLowerCase().includes(searchLower) ||
          searchLower.includes(e.name.toLowerCase()) ||
          (e.name_en?.toLowerCase() ?? '').includes(searchLower) ||
          searchLower.includes(e.name_en?.toLowerCase() ?? '')
        );
        if (partial) {
          resolvedIds.push(partial.id);
          continue;
        }
        notFound.push(name);
      }

      if (resolvedIds.length === 0) {
        throw new Error(`No matching equipment found for: ${notFound.join(', ')}`);
      }

      await ctx.mutations.setUserEquipment.mutateAsync({
        equipment_ids: resolvedIds,
      });

      if (notFound.length > 0) {
        console.warn('[ActionRegistry] Equipment not found:', notFound);
      }
    },
    toolDescription: 'Geraetepark aktualisieren. Setze die Liste der verfuegbaren Trainingsgeraete.',
    toolSchema: ToolSchemaMap.update_equipment,
    agentHint: 'training',
  });

  // ── search_product ─────────────────────────────────────────────────────
  actionRegistry.register({
    type: 'search_product',
    schema: SearchProductSchema,
    display: {
      icon: '🔍',
      titleDE: 'Produkt wird recherchiert...',
      titleEN: 'Searching product...',
      summary: (d) => `Suche nach "${d.query ?? 'Produkt'}"`,
    },
    execute: async () => {
      // Auto-executed by the agent system, no mutation needed here
    },
    autoExecute: true,
    toolDescription: 'Produkt recherchieren. Suche nach Naehrwertinformationen fuer ein Lebensmittel.',
    toolSchema: ToolSchemaMap.search_product,
    agentHint: 'nutrition',
  });

  // ── restart_tour ───────────────────────────────────────────────────────
  actionRegistry.register({
    type: 'restart_tour',
    schema: RestartTourSchema,
    display: {
      icon: '🎯',
      titleDE: 'Produkttour wird gestartet...',
      titleEN: 'Starting product tour...',
      summary: () => 'Tour wird neu gestartet',
    },
    execute: async () => {
      // Auto-executed by the agent system, no mutation needed here
    },
    autoExecute: true,
    toolDescription: 'Produkttour neu starten. Startet die gefuehrte Tour durch die App.',
    toolSchema: ToolSchemaMap.restart_tour,
    agentHint: 'general',
  });

  console.log(`[ActionRegistry] ${actionRegistry.size()} actions registered`);
}
