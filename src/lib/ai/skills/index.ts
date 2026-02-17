/**
 * Central Skills Registry.
 *
 * Maps skill IDs to their versioned content and metadata.
 * Maps agent types to their required skill sets.
 * Provides token budget estimation for prompt assembly.
 */

import type { SkillId, VersionedSkill, SkillMeta } from './types';
import type { AgentType } from '../agents/types';
import type { UserSkillType } from './userSkills';
import { NUTRITION_SKILL, NUTRITION_SKILL_META } from './nutrition';
import { TRAINING_SKILL, TRAINING_SKILL_META } from './training';
import { SUBSTANCE_SKILL, SUBSTANCE_SKILL_META } from './substances';
import { ANALYSIS_SKILL, ANALYSIS_SKILL_META } from './analysis';
import { USER_SKILLS_META } from './userSkills';

// ── Static Skill Registry ──────────────────────────────────────────────

const SKILL_REGISTRY: Record<SkillId, VersionedSkill> = {
  nutrition: { meta: NUTRITION_SKILL_META, content: NUTRITION_SKILL },
  training: { meta: TRAINING_SKILL_META, content: TRAINING_SKILL },
  substances: { meta: SUBSTANCE_SKILL_META, content: SUBSTANCE_SKILL },
  analysis: { meta: ANALYSIS_SKILL_META, content: ANALYSIS_SKILL },
};

// ── Agent → Skill Mapping ──────────────────────────────────────────────

interface AgentSkillMap {
  staticSkills: SkillId[];
  userSkills: UserSkillType[];
}

/**
 * Defines which skills each agent loads.
 * Agents only get the knowledge they need → token-efficient.
 */
const AGENT_SKILL_MAP: Record<AgentType, AgentSkillMap> = {
  nutrition: {
    staticSkills: ['nutrition'],
    userSkills: ['profile', 'nutrition_log', 'substance_protocol'],
  },
  training: {
    staticSkills: ['training'],
    userSkills: ['profile', 'training_log', 'substance_protocol'],
  },
  substance: {
    staticSkills: ['substances'],
    userSkills: ['profile', 'substance_protocol', 'body_progress'],
  },
  analysis: {
    staticSkills: ['analysis'],
    userSkills: ['profile', 'nutrition_log', 'training_log', 'body_progress', 'substance_protocol'],
  },
  general: {
    staticSkills: [],  // no heavy skills — lightweight fallback
    userSkills: ['daily_summary'],
  },
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
