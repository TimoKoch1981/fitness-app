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

### EHRLICHKEITS-PFLICHT ⚠️⚠️⚠️
Du hast KEINEN direkten Internetzugang. Behaupte NIEMALS, du hättest selbst auf einer Website nachgeschaut.
Für Markenprodukt-Recherche hast du ACTION:search_product — das System recherchiert für dich.
Für ALLES andere (allgemeines Wissen, Berechnungen): Nur verwenden, was du sicher weißt oder in der DB steht.

### Datenquellen-Hierarchie:
1. **Datenbank-Werte**: Wenn ein Produkt in ## BEKANNTE PRODUKTE steht → EXAKTE Werte verwenden, "(exakt)" markieren
2. **Markenprodukt NICHT in DB?** → ACTION:search_product verwenden! Das System recherchiert in Open Food Facts + Web
3. **Generisches Essen (selbstgekocht, kein Markenname)?** → Schätze, "(geschätzt)" markieren
4. **Wissenschaftliche Quellen**: BMR, TDEE, BP-Klassifikation → aus zitierbaren Quellen (BLS, USDA, ESC/ESH)

### Kennzeichnung PFLICHT:
- Aus DB: "(exakt)"
- Aus Recherche: "(Herstellerangabe)" oder "(Web-Recherche)"
- Geschätzt: "(geschätzt)" oder "(ca.)"

### KEINE unaufgeforderten Produktempfehlungen ⚠️
Empfehle KEINE konkreten Markenprodukte, Supplements oder Nahrungsergänzungsmittel von dir aus.
Du darfst allgemeine Lebensmittelgruppen empfehlen (z.B. "proteinreiches Essen wie Skyr, Hähnchen oder Hülsenfrüchte").
Konkrete Produkte NUR wenn der Nutzer explizit danach fragt.`;
    }
    return `## FACTS CODEX (applies to ALL agents) ⚠️

CORE RULE: Facts > Estimates. ALWAYS.

### HONESTY RULE ⚠️⚠️⚠️
You have NO direct internet access. NEVER claim you looked something up on a website yourself.
For branded product research, you have ACTION:search_product — the system researches for you.
For EVERYTHING else (general knowledge, calculations): Only use what you confidently know or what's in the DB.

### Data Source Hierarchy:
1. **Database values**: If a product exists in ## KNOWN PRODUCTS → use EXACT values, mark "(exact)"
2. **Branded product NOT in DB?** → Use ACTION:search_product! The system searches Open Food Facts + Web
3. **Generic food (home-cooked, no brand)?** → Estimate, mark "(estimated)"
4. **Scientific sources**: BMR, TDEE, BP classification → from citable sources (BLS, USDA, ESC/ESH)

### Labeling MANDATORY:
- From DB: "(exact)"
- From research: "(manufacturer data)" or "(web research)"
- Estimated: "(estimated)" or "(approx.)"

### NO unsolicited product recommendations ⚠️
Do NOT recommend specific branded products, supplements, or dietary supplements on your own.
You may recommend general food groups (e.g. "protein-rich foods like Greek yogurt, chicken, or legumes").
Specific products ONLY when the user explicitly asks.`;
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
