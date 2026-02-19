/**
 * Abstract Base Agent.
 *
 * All specialist agents extend this class.
 * Handles: skill loading, prompt assembly, provider communication.
 *
 * Flow:
 * 1. Agent gets AgentContext (health data + conversation history)
 * 2. buildSystemPrompt() assembles: Role Header + Static Skills + User Skills + Instructions
 * 3. execute() sends prompt + history to AI provider → returns AgentResult
 */

import type { AgentConfig, AgentContext, AgentResult } from './types';
import type { ChatMessage, StreamCallback } from '../types';
import { getSkillContent, getSkillsForAgent, getSkillVersionMap } from '../skills/index';
import { generateUserSkills, type UserSkillData } from '../skills/userSkills';
import { getAIProvider } from '../provider';

export abstract class BaseAgent {
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /** Get the agent's static configuration */
  getConfig(): AgentConfig {
    return this.config;
  }

  /**
   * Build the complete system prompt from skills.
   * Order: Role Header → Static Knowledge → User Context → Agent Instructions
   */
  protected buildSystemPrompt(context: AgentContext): string {
    const parts: string[] = [];

    // 1. Agent identity / role header (defined by subclass)
    parts.push(this.buildRoleHeader(context.language));

    // 2. Static knowledge-base skills (versioned, domain-specific)
    for (const skillId of this.config.staticSkills) {
      parts.push(getSkillContent(skillId));
    }

    // 3. Dynamic user skills (personalized from live data)
    const userData = this.buildUserSkillData(context);
    const userSkillContent = generateUserSkills(userData, this.config.userSkills);
    if (userSkillContent) {
      parts.push(userSkillContent);
    }

    // 4. Agent-specific instructions (optional override by subclass)
    const instructions = this.getAgentInstructions(context.language);
    if (instructions) {
      parts.push(instructions);
    }

    return parts.filter(Boolean).join('\n\n');
  }

  /** Override in subclass: define the agent's role and personality */
  protected abstract buildRoleHeader(language: 'de' | 'en'): string;

  /** Override in subclass (optional): add extra agent-specific instructions */
  protected getAgentInstructions(_language: 'de' | 'en'): string | null {
    return null;
  }

  /** Convert HealthContext → UserSkillData shape for the skill generators */
  protected buildUserSkillData(context: AgentContext): UserSkillData {
    const hc = context.healthContext;
    return {
      profile: hc.profile,
      dailyStats: hc.dailyStats,
      recentMeals: hc.recentMeals,
      recentWorkouts: hc.recentWorkouts,
      latestBody: hc.latestBodyMeasurement,
      bodyHistory: [], // TODO: expose from BodyMeasurements hook when available
      activeSubstances: hc.activeSubstances,
      recentSubstanceLogs: hc.recentSubstanceLogs,
      recentBloodPressure: hc.recentBloodPressure,
      trainingGoals: hc.trainingGoals,
      userProducts: hc.userProducts,
      standardProducts: hc.standardProducts,
    };
  }

  /**
   * Execute the agent: build prompt → call provider → return structured result.
   * Uses blocking (non-streaming) mode — prefer executeStream() for interactive chat.
   */
  async execute(context: AgentContext): Promise<AgentResult> {
    const systemPrompt = this.buildSystemPrompt(context);

    // Assemble messages: system prompt + last 8 conversation messages
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...context.conversationHistory.slice(-8),
    ];

    const provider = getAIProvider();
    const response = await provider.chat(messages);

    // Build version map for transparency
    const skillMap = getSkillsForAgent(this.config.type);
    const versions = getSkillVersionMap(skillMap.staticSkills);

    return {
      content: response.content,
      agentType: this.config.type,
      agentName: this.config.name,
      agentIcon: this.config.icon,
      skillVersions: versions,
      tokensUsed: response.tokensUsed,
      model: response.model,
    };
  }

  /**
   * Execute with streaming — calls onChunk with partial text as it arrives.
   * Returns the final AgentResult when the stream ends.
   */
  async executeStream(
    context: AgentContext,
    onChunk: StreamCallback,
  ): Promise<AgentResult> {
    const systemPrompt = this.buildSystemPrompt(context);

    console.log(`[Agent:${this.config.type}] Prompt: ${systemPrompt.length} chars (~${Math.round(systemPrompt.length / 4)} tokens)`);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...context.conversationHistory.slice(-8),
    ];

    const provider = getAIProvider();
    const response = await provider.chatStream(messages, onChunk);

    const skillMap = getSkillsForAgent(this.config.type);
    const versions = getSkillVersionMap(skillMap.staticSkills);

    return {
      content: response.content,
      agentType: this.config.type,
      agentName: this.config.name,
      agentIcon: this.config.icon,
      skillVersions: versions,
      tokensUsed: response.tokensUsed,
      model: response.model,
    };
  }
}
