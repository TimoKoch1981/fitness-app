/**
 * Versioning and metadata types for the Knowledge-Base skill system.
 *
 * Every static skill has an immutable metadata envelope that tracks:
 * - Semantic version (major.minor.patch)
 * - Last updated date
 * - Source citations
 * - Approximate token count (for context window budget)
 * - Changelog of all changes
 */

export interface ChangelogEntry {
  version: string;         // semver: "1.0.0"
  date: string;            // ISO date: "2026-02-17"
  changes: string;         // human-readable description
}

export interface SkillMeta {
  id: SkillId;
  name: string;            // human-readable display name (DE): "Ernährungswissenschaft"
  version: string;         // current semver
  updatedAt: string;       // ISO date of last update
  sources: string[];       // citation list
  tokenEstimate: number;   // approximate token count for budget planning
  changelog: ChangelogEntry[];
}

export interface VersionedSkill {
  meta: SkillMeta;
  content: string;         // the actual prompt text (Markdown)
}

/** Static knowledge-base skill identifiers */
export type SkillId =
  | 'nutrition'
  | 'training'
  | 'substances'
  | 'anabolics'
  | 'anabolics_powerplus'
  | 'analysis'
  | 'beauty'
  | 'attractiveness'
  | 'medical'
  | 'sleep'
  | 'supplements'
  | 'pct'
  | 'competition'
  | 'femaleFitness'
  | 'nutritionScience';

/** Metadata for the dynamic user skill generator */
export interface UserSkillsMeta {
  id: 'user_skills';
  version: string;
  updatedAt: string;
  generatorVersion: string; // version of the generator logic itself
  changelog: ChangelogEntry[];
}
