/**
 * Central Skills Registry.
 *
 * Maps skill IDs to their versioned content and metadata.
 * Maps agent types to their required skill sets.
 * Provides token budget estimation for prompt assembly.
 */

import type { SkillId, VersionedSkill, SkillMeta } from './types';
import type { AgentType } from '../agents/types';
import type { TrainingMode } from '../../../types/health';
import type { UserSkillType } from './userSkills';
import { NUTRITION_SKILL, NUTRITION_SKILL_META } from './nutrition';
import { TRAINING_SKILL, TRAINING_SKILL_META } from './training';
import { SUBSTANCE_SKILL, SUBSTANCE_SKILL_META } from './substances';
import { ANABOLICS_SKILL, ANABOLICS_SKILL_META, ANABOLICS_POWERPLUS_SKILL, ANABOLICS_POWERPLUS_SKILL_META } from './anabolics';
import { ANALYSIS_SKILL, ANALYSIS_SKILL_META } from './analysis';
import { BEAUTY_SKILL, BEAUTY_SKILL_META } from './beauty';
import { ATTRACTIVENESS_SKILL, ATTRACTIVENESS_SKILL_META } from './attractiveness';
import { MEDICAL_SKILL, MEDICAL_SKILL_META } from './medical';
import { SLEEP_SKILL, SLEEP_SKILL_META } from './sleep';
import { SUPPLEMENTS_SKILL, SUPPLEMENTS_SKILL_META } from './supplements';
import { PCT_SKILL, PCT_SKILL_META } from './pct';
import { COMPETITION_SKILL, COMPETITION_SKILL_META } from './competition';
import { FEMALE_FITNESS_SKILL, FEMALE_FITNESS_SKILL_META } from './femaleFitness';
import { USER_SKILLS_META } from './userSkills';

// ── Static Skill Registry ──────────────────────────────────────────────

const SKILL_REGISTRY: Record<SkillId, VersionedSkill> = {
  nutrition: { meta: NUTRITION_SKILL_META, content: NUTRITION_SKILL },
  training: { meta: TRAINING_SKILL_META, content: TRAINING_SKILL },
  substances: { meta: SUBSTANCE_SKILL_META, content: SUBSTANCE_SKILL },
  anabolics: { meta: ANABOLICS_SKILL_META, content: ANABOLICS_SKILL },
  analysis: { meta: ANALYSIS_SKILL_META, content: ANALYSIS_SKILL },
  beauty: { meta: BEAUTY_SKILL_META, content: BEAUTY_SKILL },
  attractiveness: { meta: ATTRACTIVENESS_SKILL_META, content: ATTRACTIVENESS_SKILL },
  medical: { meta: MEDICAL_SKILL_META, content: MEDICAL_SKILL },
  sleep: { meta: SLEEP_SKILL_META, content: SLEEP_SKILL },
  supplements: { meta: SUPPLEMENTS_SKILL_META, content: SUPPLEMENTS_SKILL },
  pct: { meta: PCT_SKILL_META, content: PCT_SKILL },
  competition: { meta: COMPETITION_SKILL_META, content: COMPETITION_SKILL },
  femaleFitness: { meta: FEMALE_FITNESS_SKILL_META, content: FEMALE_FITNESS_SKILL },
  anabolics_powerplus: { meta: ANABOLICS_POWERPLUS_SKILL_META, content: ANABOLICS_POWERPLUS_SKILL },
};

// ── Agent → Skill Mapping ──────────────────────────────────────────────

interface AgentSkillMap {
  staticSkills: SkillId[];
  userSkills: UserSkillType[];
}

/**
 * Defines which skills each agent loads.
 * Agents only get the knowledge they need → token-efficient.
 *
 * v2.0.0: Extended with 5 new skills (sleep, supplements, pct, competition, femaleFitness)
 */
const AGENT_SKILL_MAP: Record<AgentType, AgentSkillMap> = {
  nutrition: {
    staticSkills: ['nutrition', 'supplements'],
    userSkills: ['profile', 'nutrition_log', 'substance_protocol'],
  },
  training: {
    staticSkills: ['training', 'sleep', 'competition'],
    userSkills: ['profile', 'training_log', 'substance_protocol', 'available_equipment'],
  },
  substance: {
    staticSkills: ['substances', 'anabolics', 'pct'],
    userSkills: ['profile', 'substance_protocol', 'body_progress'],
  },
  analysis: {
    staticSkills: ['analysis'],
    userSkills: ['profile', 'nutrition_log', 'training_log', 'body_progress', 'substance_protocol'],
  },
  beauty: {
    staticSkills: ['beauty'],
    userSkills: ['profile', 'substance_protocol', 'body_progress'],
  },
  lifestyle: {
    staticSkills: ['attractiveness'],
    userSkills: ['profile', 'body_progress'],
  },
  medical: {
    staticSkills: ['medical', 'sleep', 'pct'],
    userSkills: ['profile', 'substance_protocol', 'body_progress'],
  },
  general: {
    staticSkills: [],  // no heavy skills — lightweight fallback
    userSkills: ['daily_summary'],
  },
};

// ── Mode-Specific Skill Extensions ─────────────────────────────────────
// Skills that are only loaded for certain training modes.
// Key: base skill ID that triggers the extension.
// Value: { skillId to add, required mode(s) }.

interface ModeSkillExtension {
  skillId: SkillId;
  modes: TrainingMode[];
}

const MODE_SKILL_EXTENSIONS: Record<string, ModeSkillExtension[]> = {
  // Power+ users get the full cycle/dosage/interaction tables
  anabolics: [
    { skillId: 'anabolics_powerplus', modes: ['power_plus'] },
  ],
  // Power & Power+ users get competition skill on training agent
  training: [
    { skillId: 'competition', modes: ['power', 'power_plus'] },
  ],
};

// ── Public API ──────────────────────────────────────────────────────────

/** Get a versioned skill by ID */
export function getSkill(id: SkillId): VersionedSkill {
  return SKILL_REGISTRY[id];
}

/** Get just the metadata for a skill */
export function getSkillMeta(id: SkillId): SkillMeta {
  return SKILL_REGISTRY[id].meta;
}

/** Get just the content string for a skill */
export function getSkillContent(id: SkillId): string {
  return SKILL_REGISTRY[id].content;
}

/** Get all registered skills */
export function getAllSkills(): VersionedSkill[] {
  return Object.values(SKILL_REGISTRY);
}

/** Get the skill mapping for a specific agent type */
export function getSkillsForAgent(agentType: AgentType): AgentSkillMap {
  return AGENT_SKILL_MAP[agentType];
}

/**
 * Get the static skill IDs for an agent, extended with mode-specific skills.
 * E.g. substance agent in power_plus mode also gets 'anabolics_powerplus'.
 */
export function getSkillIdsForMode(agentType: AgentType, trainingMode: TrainingMode): SkillId[] {
  const base = AGENT_SKILL_MAP[agentType].staticSkills;
  const extended = [...base];

  for (const baseSkillId of base) {
    const extensions = MODE_SKILL_EXTENSIONS[baseSkillId];
    if (extensions) {
      for (const ext of extensions) {
        if (ext.modes.includes(trainingMode) && !extended.includes(ext.skillId)) {
          extended.push(ext.skillId);
        }
      }
    }
  }

  return extended;
}

/**
 * Build a version map for the given skills.
 * Used for AgentResult.skillVersions — transparency about which knowledge was used.
 */
export function getSkillVersionMap(skillIds: SkillId[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const id of skillIds) {
    map[id] = SKILL_REGISTRY[id].meta.version;
  }
  map['user_skills'] = USER_SKILLS_META.version;
  return map;
}

/** Calculate estimated token cost for a set of static skills */
export function estimateTokenBudget(skillIds: SkillId[]): number {
  return skillIds.reduce((sum, id) => sum + SKILL_REGISTRY[id].meta.tokenEstimate, 0);
}
