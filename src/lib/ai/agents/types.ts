/**
 * Agent system types for the FitBuddy multi-agent architecture.
 *
 * Defines the contracts for:
 * - Agent types and configuration
 * - Agent execution context and results
 * - Routing decisions
 */

import type { SkillId } from '../skills/types';
import type { UserSkillType } from '../skills/userSkills';
import type { ChatMessage, ParsedIntent } from '../types';
import type { HealthContext } from '../../../types/health';

/** Available specialist agent types */
export type AgentType =
  | 'nutrition'
  | 'training'
  | 'substance'
  | 'analysis'
  | 'general';

/** Static configuration for an agent */
export interface AgentConfig {
  type: AgentType;
  name: string;                    // display name (DE): "Ernährungs-Agent"
  nameEN: string;                  // display name (EN): "Nutrition Agent"
  icon: string;                    // emoji for UI attribution
  staticSkills: SkillId[];         // which knowledge-base skills to load
  userSkills: UserSkillType[];     // which dynamic user skills to generate
  maxContextTokens: number;        // token budget for this agent's prompt
  description: string;             // what this agent does (DE)
}

/** Runtime context passed to an agent for execution */
export interface AgentContext {
  healthContext: Partial<HealthContext>;
  conversationHistory: ChatMessage[];
  language: 'de' | 'en';
}

/** Structured result from an agent execution */
export interface AgentResult {
  content: string;                 // the text response
  agentType: AgentType;            // which agent responded
  agentName: string;               // display name
  agentIcon: string;               // emoji
  skillVersions: Record<string, string>; // skill_id -> version used
  intent?: ParsedIntent;           // optional parsed intent (for future action handling)
  tokensUsed?: number;
  model?: string;
}

/** Intent detection result from the router */
export interface RoutingDecision {
  targetAgent: AgentType;
  confidence: number;              // 0-1
  matchedKeywords: string[];       // for debugging / transparency
  reasoning?: string;              // optional explanation
}
