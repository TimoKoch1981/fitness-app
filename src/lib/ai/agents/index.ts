/**
 * Agent Registry — lazy singleton factory for all agents.
 */

import type { AgentType } from './types';
import { BaseAgent } from './baseAgent';
import { NutritionAgent } from './nutritionAgent';
import { TrainingAgent } from './trainingAgent';
import { SubstanceAgent } from './substanceAgent';
import { AnalysisAgent } from './analysisAgent';
import { GeneralAgent } from './generalAgent';

/** Lazy singleton instances — created on first access */
const agents = new Map<AgentType, BaseAgent>();

/** Get an agent by type (creates on first call, returns singleton after) */
export function getAgent(type: AgentType): BaseAgent {
  if (!agents.has(type)) {
    switch (type) {
      case 'nutrition':
        agents.set(type, new NutritionAgent());
        break;
      case 'training':
        agents.set(type, new TrainingAgent());
        break;
      case 'substance':
        agents.set(type, new SubstanceAgent());
        break;
      case 'analysis':
        agents.set(type, new AnalysisAgent());
        break;
      case 'general':
        agents.set(type, new GeneralAgent());
        break;
    }
  }
  return agents.get(type)!;
}

/** All available agent types */
export function getAllAgentTypes(): AgentType[] {
  return ['nutrition', 'training', 'substance', 'analysis', 'general'];
}

// Re-export types for convenience
export type { AgentType, AgentConfig, AgentContext, AgentResult, RoutingDecision, MultiRoutingDecision } from './types';
export { BaseAgent } from './baseAgent';
