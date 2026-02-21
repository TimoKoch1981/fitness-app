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
import { getOnboardingPrompt } from './onboardingPrompt';
import { analyzeDeviations, formatDeviationsForAgent } from '../deviations';

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
   * Order: Facts Codex → Role Header → Static Knowledge → User Context → Agent Instructions
   */
  protected buildSystemPrompt(context: AgentContext): string {
    const parts: string[] = [];

    // 0. Global Facts Codex (applies to ALL agents — facts > estimates)
    parts.push(this.getFactsCodex(context.language));

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

    // 5. Proactive deviations — inject alerts relevant to this agent
    const deviations = analyzeDeviations(context.healthContext, context.healthContext.dailyCheckin);
    const deviationBlock = formatDeviationsForAgent(deviations, this.config.type, context.language);
    if (deviationBlock) {
      parts.push(deviationBlock);
    }

    // 6. Onboarding mode: prepend onboarding instructions when user profile is incomplete
    if (context.healthContext.onboardingMode) {
      parts.unshift(getOnboardingPrompt(context.language));
    }

    return parts.filter(Boolean).join('\n\n');
  }

  /**
   * Global Facts Codex — applies to ALL agents.
   * Core principle: Facts > Estimates. Always.
   */
  protected getFactsCodex(language: 'de' | 'en'): string {
    if (language === 'de') {
      return `## FAKTEN-CODEX (gilt für ALLE Agenten) ⚠️

GRUNDREGEL: Fakten > Schätzungen. IMMER.

1. **Datenbank-Werte**: Wenn ein Produkt/Wert in der Datenbank steht → EXAKTE Werte verwenden, "(exakt)" markieren
2. **Hersteller-Angaben**: Wenn ein Markenprodukt genannt wird → Herstellerangaben von der Verpackung/Website verwenden, NICHT schätzen
3. **Wissenschaftliche Quellen**: BMR, TDEE, BP-Klassifikation → immer aus zitierbaren Quellen (BLS, USDA, ESC/ESH)
4. **Schätzung NUR als letztes Mittel**: Nur wenn KEINE Fakten verfügbar sind (z.B. selbstgekochtes Gericht ohne Rezept)
5. **Kennzeichnung PFLICHT**:
   - Fakten: "(exakt)" oder "(Herstellerangabe)" oder "(BLS 4.0)"
   - Schätzungen: "(geschätzt)" oder "(ca.)"
6. **NIE Markenprodukte schätzen**: Markenprodukte haben EXAKTE Nährwerte auf der Verpackung — diese verwenden!`;
    }
    return `## FACTS CODEX (applies to ALL agents) ⚠️

CORE RULE: Facts > Estimates. ALWAYS.

1. **Database values**: If a product/value exists in the database → use EXACT values, mark "(exact)"
2. **Manufacturer data**: If a branded product is mentioned → use manufacturer data from packaging/website, do NOT estimate
3. **Scientific sources**: BMR, TDEE, BP classification → always from citable sources (BLS, USDA, ESC/ESH)
4. **Estimation ONLY as last resort**: Only when NO facts are available (e.g. home-cooked dish without recipe)
5. **Labeling MANDATORY**:
   - Facts: "(exact)" or "(manufacturer data)" or "(BLS 4.0)"
   - Estimates: "(estimated)" or "(approx.)"
6. **NEVER estimate branded products**: Branded products have EXACT nutritional values on packaging — use those!`;
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
      activePlan: hc.activePlan,
      userProducts: hc.userProducts,
      standardProducts: hc.standardProducts,
      availableEquipment: hc.availableEquipment,
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
