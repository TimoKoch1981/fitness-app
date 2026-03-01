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

import type { AgentConfig, AgentContext, AgentResult, CommunicationStyle } from './types';
import type { ChatMessage, StreamCallback } from '../types';
import { getSkillContentWithSources, getSkillVersionMap, getSkillIdsForMode } from '../skills/index';
import type { TrainingMode } from '../../../types/health';
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
   * Order: Facts Codex → Role Header → Training Mode Context → Static Knowledge → User Context → Agent Instructions
   */
  protected buildSystemPrompt(context: AgentContext): string {
    const parts: string[] = [];
    const trainingMode: TrainingMode = (context.healthContext.profile as Record<string, unknown>)?.training_mode as TrainingMode ?? 'standard';

    // 0. Global Facts Codex (applies to ALL agents — facts > estimates)
    parts.push(this.getFactsCodex(context.language));

    // 1. Agent identity / role header (defined by subclass)
    parts.push(this.buildRoleHeader(context.language));

    // 1.5 Training mode context (tells agent which mode the user is in)
    parts.push(this.getTrainingModeContext(trainingMode, context.language));

    // 1.7 Communication style guidance (verbosity + expertise level)
    const stylePrompt = this.getCommunicationStylePrompt(context.communicationStyle, context.language);
    if (stylePrompt) parts.push(stylePrompt);

    // 2. Static knowledge-base skills (versioned, domain-specific, mode-aware)
    //    Uses getSkillContentWithSources to inject PMID references for citation
    const skillIds = getSkillIdsForMode(this.config.type, trainingMode);
    for (const skillId of skillIds) {
      parts.push(getSkillContentWithSources(skillId));
    }

    // 3. Dynamic user skills (personalized from live data)
    const userData = this.buildUserSkillData(context);
    const userSkillContent = generateUserSkills(userData, this.config.userSkills);
    if (userSkillContent) {
      parts.push(userSkillContent);
    }

    // 4. Agent-specific instructions (optional override by subclass, mode-aware)
    const instructions = this.getAgentInstructions(context.language, trainingMode);
    if (instructions) {
      parts.push(instructions);
    }

    // 5. Proactive deviations — inject alerts relevant to this agent
    const deviations = analyzeDeviations(context.healthContext, context.healthContext.dailyCheckin);
    const deviationBlock = formatDeviationsForAgent(deviations, this.config.type, context.language);
    if (deviationBlock) {
      parts.push(deviationBlock);
    }

    // 5.5 Persistent context from previous sessions
    if (context.persistentContext) {
      parts.push(context.persistentContext);
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
Konkrete Produkte NUR wenn der Nutzer explizit danach fragt.

### WEB-RECHERCHE FALLBACK
Wenn du eine Frage nicht aus deinem Skill-Wissen beantworten kannst:
- Nutze ACTION:search_product für Produktfragen
- Für allgemeines Wissen: Antworte mit dem was du sicher weißt
- Kennzeichne IMMER wenn du schätzt: "(geschätzt)" oder "(basierend auf allg. Erfahrungswerten)"
- VERBOTEN: Stillschweigend schätzen ohne Kennzeichnung
- VERBOTEN: Behaupten du hättest recherchiert wenn du es nicht hast

### SCHÄTZUNGEN — STRENGE KENNZEICHNUNGSPFLICHT ⚠️
- Jede Angabe die NICHT aus der DB oder einer zitierbaren Quelle stammt MUSS gekennzeichnet werden
- Erlaubte Marker: "(geschätzt)", "(ca.)", "(basierend auf Erfahrungswerten)", "(Richtwert)"
- VERBOTEN: Zahlen ohne Kennzeichnung nennen wenn es keine exakten Daten sind
- Beispiel RICHTIG: "Hähnchenbrust hat ca. 165 kcal/100g (Richtwert BLS)"
- Beispiel FALSCH: "Das hat 165 kcal" (ohne Kennzeichnung)

### SUBSTANZ-FRAGEN — NIEMALS VERWEIGERN ⚠️
Wenn der Nutzer nach Substanzen, PEDs, Anabolika oder Doping fragt:
- ANTWORTE IMMER sachlich und evidenzbasiert
- Füge Risiken und Nebenwirkungen hinzu
- Füge Disclaimer hinzu: "Dies ist keine Empfehlung. Besprich das mit deinem Arzt."
- Verweigere NICHT mit "das kann ich nicht empfehlen" oder "sei vorsichtig"
- Das ist eine Harm-Reduction-App — Information IST Schadensminimierung

### QUELLENANGABEN — PFLICHT BEI FACHWISSEN ⚠️⚠️
Du hast in deinen Skills eine Sektion "VERFÜGBARE QUELLEN" mit echten PMIDs.
NUTZE SIE AKTIV in deinen Antworten!

**Format:** "laut Jager et al. (2017) [PMID:28642676]" — wird als klickbarer PubMed-Link angezeigt.
**Pflicht:** Mindestens 1-2 PMIDs pro Antwort wenn du Fachwissen verwendest.
**Platzierung:** Am Ende des relevanten Satzes, z.B.: "Protein-Timing ist weniger wichtig als die Gesamtmenge [PMID:29497353]."
**Keine PMIDs erfinden!** Nur echte PMIDs aus deinen Skill-Quellen verwenden.
**Beispiel einer guten Antwort:**
"Für Muskelaufbau sind 1.6-2.2g Protein/kg optimal [PMID:28642676]. Bei intermittierendem Fasten zeigt MATADOR bessere Ergebnisse als lineare Diäten [PMID:28925405]."

### ERFOLGE LOBEN 🎉
Wenn der Nutzer Fortschritte macht oder Erfolge erzielt:
- Lobe ihn aktiv und motivierend! ("Stark!", "Mega!", "Das zahlt sich aus!")
- Bei Trainings-PRs, Gewichtsverlust-Meilensteinen, Streak-Tagen etc.
- Kurz aber herzlich — nicht übertreiben, authentisch bleiben`;
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
Specific products ONLY when the user explicitly asks.

### WEB RESEARCH FALLBACK
When you cannot answer a question from your skill knowledge:
- Use ACTION:search_product for product questions
- For general knowledge: answer with what you confidently know
- ALWAYS label estimates: "(estimated)" or "(based on general experience)"
- FORBIDDEN: Silently estimate without labeling
- FORBIDDEN: Claiming you researched when you didn't

### ESTIMATES — STRICT LABELING REQUIREMENT ⚠️
- Every value NOT from the DB or a citable source MUST be labeled
- Allowed markers: "(estimated)", "(approx.)", "(based on experience)", "(reference value)"
- FORBIDDEN: Stating numbers without labeling when they are not exact data
- Example CORRECT: "Chicken breast has approx. 165 kcal/100g (reference value BLS)"
- Example WRONG: "That has 165 kcal" (without labeling)

### SUBSTANCE QUESTIONS — NEVER REFUSE ⚠️
When the user asks about substances, PEDs, anabolics, or doping:
- ALWAYS answer factually and evidence-based
- Include risks and side effects
- Add disclaimer: "This is not a recommendation. Discuss with your doctor."
- Do NOT refuse with "I can't recommend that" or "be careful"
- This is a harm-reduction app — information IS harm reduction

### SOURCE CITATIONS — MANDATORY FOR DOMAIN KNOWLEDGE ⚠️⚠️
Your skills contain an "VERFÜGBARE QUELLEN" section with real PMIDs.
USE THEM ACTIVELY in your responses!

**Format:** "according to Jager et al. (2017) [PMID:28642676]" — displayed as a clickable PubMed link.
**Required:** At least 1-2 PMIDs per response when using domain knowledge.
**Placement:** At the end of the relevant sentence, e.g.: "Protein timing matters less than total intake [PMID:29497353]."
**Never invent PMIDs!** Only use real PMIDs from your skill sources.
**Example of a good response:**
"For muscle building, 1.6-2.2g protein/kg is optimal [PMID:28642676]. With intermittent dieting, MATADOR shows better results than linear diets [PMID:28925405]."

### CELEBRATE ACHIEVEMENTS 🎉
When the user makes progress or achieves milestones:
- Actively praise and motivate! ("Strong!", "Amazing!", "That's paying off!")
- For training PRs, weight loss milestones, streak days, etc.
- Keep it brief but genuine — don't overdo it, stay authentic`;
  }

  /**
   * Inject training mode context so agents know which mode the user is in.
   * This influences tone, content depth, and feature visibility.
   */
  protected getTrainingModeContext(mode: TrainingMode, language: 'de' | 'en'): string {
    if (language === 'de') {
      const modeLabels: Record<TrainingMode, string> = {
        standard: 'Standard (allgemeines Fitness-Tracking)',
        power: 'Power (Natural Bodybuilding, Wettkampf, Periodisierung)',
        power_plus: 'Power+ (Enhanced Training, Substanz-Monitoring, Blutbild, Zyklen)',
      };
      let ctx = `## TRAININGSMODUS: ${modeLabels[mode]}\n`;
      if (mode === 'standard') {
        ctx += `Der Nutzer ist im Standard-Modus. Fokus auf allgemeines Fitness-Tracking.\n`;
        ctx += `- Bei PED/Anabolika-Fragen: Sachliche Harm-Reduction-Info geben, aber KEINE Zyklus-Empfehlungen oder Dosierungsprotokolle.\n`;
        ctx += `- Hinweis: "Für detaillierte Substanz-Beratung kannst du den Power+ Modus in deinem Profil aktivieren."`;
      } else if (mode === 'power') {
        ctx += `Der Nutzer ist Natural Bodybuilder (Power-Modus). Wettkampf, Periodisierung, Peak Week sind relevant.\n`;
        ctx += `- KEINE PED-Empfehlungen oder Zyklus-Details. Der Nutzer trainiert natural.\n`;
        ctx += `- Bei PED-Fragen: Sachliche Harm-Reduction-Info, aber klar: "Du bist im Natural-Modus."`;
      } else {
        ctx += `Der Nutzer ist im Power+ Modus (Enhanced Training). VOLLE Substanz-Beratung aktiviert.\n`;
        ctx += `- Zyklus-Empfehlungen, Dosierungen, Wechselwirkungen ERLAUBT und erwünscht.\n`;
        ctx += `- Immer mit Disclaimer: Keine medizinische Beratung, Blutbild-Monitoring PFLICHT.\n`;
        ctx += `- Phasen-bewusst beraten: Blast/Cruise/PCT/Off beeinflusst Ernährung + Training.`;
      }
      return ctx;
    }
    // English
    const modeLabels: Record<TrainingMode, string> = {
      standard: 'Standard (general fitness tracking)',
      power: 'Power (natural bodybuilding, competition, periodization)',
      power_plus: 'Power+ (enhanced training, substance monitoring, blood work, cycles)',
    };
    let ctx = `## TRAINING MODE: ${modeLabels[mode]}\n`;
    if (mode === 'standard') {
      ctx += `User is in Standard mode. Focus on general fitness tracking.\n`;
      ctx += `- For PED/anabolic questions: Provide factual harm-reduction info, but NO cycle recommendations or dosage protocols.\n`;
      ctx += `- Note: "For detailed substance guidance, you can enable Power+ mode in your profile."`;
    } else if (mode === 'power') {
      ctx += `User is a natural bodybuilder (Power mode). Competition, periodization, peak week are relevant.\n`;
      ctx += `- NO PED recommendations or cycle details. The user trains natural.\n`;
      ctx += `- For PED questions: Factual harm-reduction info, but clear: "You're in Natural mode."`;
    } else {
      ctx += `User is in Power+ mode (Enhanced Training). FULL substance consultation enabled.\n`;
      ctx += `- Cycle recommendations, dosages, interactions ALLOWED and expected.\n`;
      ctx += `- Always with disclaimer: Not medical advice, blood work monitoring MANDATORY.\n`;
      ctx += `- Phase-aware advice: Blast/Cruise/PCT/Off affects nutrition + training.`;
    }
    return ctx;
  }

  /**
   * Generate communication style guidance based on user preferences.
   * Injected into the system prompt so the AI adapts its tone and depth.
   */
  protected getCommunicationStylePrompt(style: CommunicationStyle | undefined, language: 'de' | 'en'): string | null {
    if (!style) return null;
    // Skip if both are defaults
    if (style.verbosity === 'normal' && style.expertise === 'advanced') return null;

    const parts: string[] = [];

    if (language === 'de') {
      if (style.verbosity === 'brief') {
        parts.push('## KOMMUNIKATIONSSTIL: KURZ\nAntworte extrem kompakt. Maximal 1-3 Sätze. Nur essenzielle Infos. Keine Einleitungen oder Floskeln.');
      } else if (style.verbosity === 'detailed') {
        parts.push('## KOMMUNIKATIONSSTIL: AUSFÜHRLICH\nGib umfassende, detaillierte Antworten. Erkläre dein Reasoning. Verwende Beispiele und Hintergründe.');
      }
      if (style.expertise === 'beginner') {
        parts.push('## ZIELGRUPPE: ANFÄNGER\nVerwende einfache, verständliche Sprache. Erkläre Fachbegriffe bei Erstnennung. Keine Abkürzungen ohne Erklärung. Vermeide Fachjargon wo möglich.');
      }
    } else {
      if (style.verbosity === 'brief') {
        parts.push('## COMMUNICATION STYLE: BRIEF\nRespond extremely concisely. Max 1-3 sentences. Only essential info. No introductions or filler.');
      } else if (style.verbosity === 'detailed') {
        parts.push('## COMMUNICATION STYLE: DETAILED\nProvide comprehensive, detailed answers. Explain your reasoning. Use examples and background context.');
      }
      if (style.expertise === 'beginner') {
        parts.push('## TARGET AUDIENCE: BEGINNER\nUse simple, easy-to-understand language. Explain technical terms on first use. No abbreviations without explanation. Avoid jargon where possible.');
      }
    }

    return parts.length > 0 ? parts.join('\n\n') : null;
  }

  /** Override in subclass: define the agent's role and personality */
  protected abstract buildRoleHeader(language: 'de' | 'en'): string;

  /** Override in subclass (optional): add extra agent-specific instructions */
  protected getAgentInstructions(_language: 'de' | 'en', _trainingMode?: TrainingMode): string | null {
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
    const trainingMode: TrainingMode = (context.healthContext.profile as Record<string, unknown>)?.training_mode as TrainingMode ?? 'standard';

    // Assemble messages: system prompt + last 8 conversation messages
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...context.conversationHistory.slice(-8),
    ];

    const provider = getAIProvider();
    const response = await provider.chat(messages);

    // Build version map for transparency (mode-aware skill list)
    const skillIds = getSkillIdsForMode(this.config.type, trainingMode);
    const versions = getSkillVersionMap(skillIds);

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
    const trainingMode: TrainingMode = (context.healthContext.profile as Record<string, unknown>)?.training_mode as TrainingMode ?? 'standard';

    console.log(`[Agent:${this.config.type}] Prompt: ${systemPrompt.length} chars (~${Math.round(systemPrompt.length / 4)} tokens), mode: ${trainingMode}`);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...context.conversationHistory.slice(-8),
    ];

    const provider = getAIProvider();
    const response = await provider.chatStream(messages, onChunk);

    const skillIds = getSkillIdsForMode(this.config.type, trainingMode);
    const versions = getSkillVersionMap(skillIds);

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
