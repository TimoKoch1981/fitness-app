/**
 * ActionRegistry — Single Source of Truth for all action types.
 *
 * Each action is registered as an ActionDescriptor containing:
 * - schema: Zod validation schema
 * - display: icon, title, summary for confirmation banner
 * - execute: async function that calls the appropriate mutation
 * - toolDescription: German description for LLM function calling
 * - toolSchema: simplified Zod schema for JSON Schema conversion
 *
 * The registry replaces the scattered switch-cases in useActionExecutor,
 * getActionDisplayInfo, SCHEMA_MAP, and TOOL_DESCRIPTIONS.
 *
 * @see docs/KONZEPT_ACTION_REGISTRY.md
 */

import { z } from 'zod';
import type { ActionType, ActionDisplayInfo } from './types';

// ── Mutation Hook Types ──────────────────────────────────────────────────
// These are the return types of all mutation hooks used by the executor.
// We use a generic type to avoid importing all 15 hook modules here.

type MutationHook = {
  mutateAsync: (data: any) => Promise<any>;
};

export interface MutationMap {
  addMeal: MutationHook;
  addWorkout: MutationHook;
  addBodyMeasurement: MutationHook;
  addBloodPressure: MutationHook;
  addBloodWork: MutationHook;
  logSubstance: MutationHook;
  addTrainingPlan: MutationHook;
  addTrainingPlanDay: MutationHook;
  modifyTrainingPlanDay: MutationHook;
  removeTrainingPlanDay: MutationHook;
  addUserProduct: MutationHook;
  addSubstance: MutationHook;
  addReminder: MutationHook;
  updateProfile: MutationHook;
  setUserEquipment: MutationHook;
  addRecipe: MutationHook;
  // Pantry (optional — execute uses direct supabase calls, only needs invalidation)
  clearPantry?: MutationHook;
  invalidatePantry?: () => void;
}

export interface ExecutionContext {
  userId?: string;
  mutations: MutationMap;
  activeSubstances?: Array<{ id: string; name: string }>;
  equipmentCatalog?: Array<{ id: string; name: string; name_en?: string }>;
}

// ── ActionDescriptor Interface ───────────────────────────────────────────

export interface ActionDescriptor {
  /** Action type identifier */
  type: ActionType;

  /** Zod validation schema (with defaults, transforms, refines) */
  schema: z.ZodSchema;

  /** Display info for the confirmation banner */
  display: {
    icon: string;
    titleDE: string;
    titleEN: string;
    summary: (data: Record<string, unknown>) => string;
  };

  /** Execute the action using mutation hooks from context */
  execute: (data: Record<string, unknown>, ctx: ExecutionContext) => Promise<void>;

  /** Skip user confirmation (search_product, restart_tour) */
  autoExecute?: boolean;

  /** German description for OpenAI function calling */
  toolDescription?: string;

  /** Simplified Zod schema for JSON Schema conversion (no .refine/.transform) */
  toolSchema?: z.ZodObject<z.ZodRawShape>;

  /** Hint: which agent should primarily use this action */
  agentHint?: string;
}

// ── ActionRegistry Class ─────────────────────────────────────────────────

class ActionRegistry {
  private actions = new Map<ActionType, ActionDescriptor>();

  register(desc: ActionDescriptor): void {
    if (this.actions.has(desc.type)) {
      console.warn(`[ActionRegistry] Overwriting: ${desc.type}`);
    }
    this.actions.set(desc.type, desc);
  }

  get(type: ActionType): ActionDescriptor | undefined {
    return this.actions.get(type);
  }

  getSchema(type: ActionType): z.ZodSchema | undefined {
    return this.actions.get(type)?.schema;
  }

  getDisplayInfo(type: ActionType, data: Record<string, unknown>): ActionDisplayInfo | null {
    const desc = this.actions.get(type);
    if (!desc) return null;
    return {
      icon: desc.display.icon,
      title: desc.display.titleDE,
      summary: desc.display.summary(data),
    };
  }

  getAutoExecuteTypes(): Set<ActionType> {
    const set = new Set<ActionType>();
    for (const [type, desc] of this.actions) {
      if (desc.autoExecute) set.add(type);
    }
    return set;
  }

  getAllToolDescriptions(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const [type, desc] of this.actions) {
      if (desc.toolDescription) map[type] = desc.toolDescription;
    }
    return map;
  }

  getAllToolSchemas(): Record<string, z.ZodObject<z.ZodRawShape>> {
    const map: Record<string, z.ZodObject<z.ZodRawShape>> = {};
    for (const [type, desc] of this.actions) {
      if (desc.toolSchema) map[type] = desc.toolSchema;
    }
    return map;
  }

  getAll(): ActionDescriptor[] {
    return Array.from(this.actions.values());
  }

  size(): number {
    return this.actions.size;
  }
}

// Singleton instance
export const actionRegistry = new ActionRegistry();

// ── Fuzzy Matching Helpers ───────────────────────────────────────────────
// Moved from useActionExecutor.ts — used by execute functions in registerDefaults.ts

/**
 * Simple Levenshtein distance between two strings.
 * Used for fuzzy substance name matching.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Fuzzy match a substance name against a list.
 * Strategy: exact → partial → Levenshtein ≤ 3.
 */
export function fuzzyMatchSubstance(
  searchName: string,
  substances: Array<{ id: string; name: string }>,
): { id: string; name: string } | null {
  const search = searchName.toLowerCase().trim();

  // 1. Exact match
  const exact = substances.find(s => s.name.toLowerCase() === search);
  if (exact) return exact;

  // 2. Partial match
  const partial = substances.find(s => {
    const name = s.name.toLowerCase();
    return name.includes(search) || search.includes(name);
  });
  if (partial) return partial;

  // 3. Levenshtein distance
  let bestMatch: { id: string; name: string } | null = null;
  let bestDistance = Infinity;
  for (const s of substances) {
    const dist = levenshtein(search, s.name.toLowerCase());
    const threshold = Math.min(3, Math.floor(s.name.length * 0.3));
    if (dist <= threshold && dist < bestDistance) {
      bestDistance = dist;
      bestMatch = s;
    }
  }

  return bestMatch;
}
