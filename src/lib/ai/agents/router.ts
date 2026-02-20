/**
 * Agent Router — Intent detection and agent dispatch.
 *
 * DESIGN: Keyword-based routing with weighted confidence scoring.
 * NO LLM call for routing — this must be instant (sub-millisecond).
 * Falls back to GeneralAgent when confidence is below threshold.
 *
 * Scoring formula: weight × (matches / √total_keywords)
 * This normalizes across different-sized keyword lists.
 */

import type { AgentType, RoutingDecision, MultiRoutingDecision, AgentContext, AgentResult } from './types';
import type { StreamCallback } from '../types';
import { getAgent } from './index';

// ── Keyword Routing Rules ───────────────────────────────────────────────

interface KeywordRule {
  agent: AgentType;
  keywords: string[];
  weight: number; // base weight (0-1), higher = more priority
}

const ROUTING_RULES: KeywordRule[] = [
  // ── Nutrition ──
  {
    agent: 'nutrition',
    weight: 0.8,
    keywords: [
      // Food & eating actions
      'essen', 'gegessen', 'esse', 'hatte', 'getrunken', 'trinke',
      'mahlzeit', 'frühstück', 'mittagessen', 'abendessen', 'morgens', 'mittags', 'abends',
      'snack', 'hunger', 'satt', 'portion', 'rezept', 'kochen', 'gab es',
      // Macros & nutrients
      'kalorien', 'kcal', 'protein', 'eiweiß', 'kohlenhydrate', 'carbs',
      'fett', 'makros', 'nährwerte', 'nährwert', 'ballaststoffe', 'fiber',
      // Nutrition planning
      'ernährung', 'ernährungs', 'ernährungsplan', 'diät', 'abnehmen', 'zunehmen',
      'kalorienziel', 'proteinziel', 'defizit', 'überschuss',
      // Hydration
      'trinken', 'wasser', 'getränk', 'hydration', 'tee', 'kaffee', 'radler', 'saft',
      // Supplements (whey/vitamin/omega stay here; kreatin/creatine/supplement → substance agent)
      'whey', 'vitamin', 'omega', 'scoop',
      // Common foods (German) — comprehensive list for reliable routing
      'hühnchen', 'hähnchen', 'reis', 'nudeln', 'brot', 'müsli', 'joghurt',
      'quark', 'obst', 'gemüse', 'salat', 'pizza', 'burger', 'ei', 'eier',
      'lachs', 'thunfisch', 'kartoffeln', 'haferflocken', 'shake',
      'skyr', 'orange', 'orangen', 'apfel', 'banane', 'birne', 'maracuja',
      'kekse', 'keks', 'schokolade', 'nappo', 'mars', 'snickers', 'raider', 'prinzenrolle',
      'suppe', 'gulasch', 'bolognese', 'döner', 'dürüm', 'kebab',
      'milch', 'käse', 'butter', 'sahne', 'schmand',
      'fleisch', 'steak', 'rind', 'schwein', 'pute', 'wurst', 'schinken',
      'fisch', 'garnelen', 'shrimp',
      'tofu', 'linsen', 'bohnen', 'erbsen', 'kichererbsen',
      'avocado', 'nüsse', 'mandeln', 'erdnuss', 'erdnussbutter',
      'marmelade', 'honig', 'zucker', 'süßigkeit',
      'erbsennudeln', 'vollkorn', 'dinkel', 'roggen',
      'porridge', 'overnight', 'smoothie', 'bowl',
      // English fallbacks
      'meal', 'food', 'eat', 'ate', 'nutrition', 'calories', 'macros',
      'chicken', 'beef', 'yogurt', 'oats', 'bread', 'rice', 'pasta',
    ],
  },

  // ── Training ──
  {
    agent: 'training',
    weight: 0.8,
    keywords: [
      // Training general
      'training', 'trainieren', 'trainiert', 'workout', 'sport', 'gym',
      'fitnessstudio', 'trainingsplan',
      // Plan editing
      'ändere', 'ändern', 'ersetze', 'ersetzen', 'tausche', 'tauschen',
      'entferne', 'entfernen', 'anpassen', 'editiere', 'bearbeite',
      'aktualisiere', 'aktualisieren',
      'change', 'replace', 'swap', 'remove', 'modify', 'update plan',
      // Exercises
      'übung', 'übungen', 'bankdrücken', 'kniebeugen', 'kreuzheben',
      'deadlift', 'squat', 'bench', 'press', 'curl', 'rudern', 'klimmzüge',
      'dips', 'latzug', 'seitheben',
      // Muscle groups
      'brust', 'rücken', 'schulter', 'beine', 'arme', 'bizeps', 'trizeps',
      'oberkörper', 'unterkörper', 'core', 'bauch',
      // Training structure
      'push', 'pull', 'leg', 'split', 'ganzkörper',
      'sets', 'sätze', 'wiederholungen', 'reps', 'gewicht',
      'hantel', 'langhantel', 'kurzhantel', 'maschine',
      // Cardio
      'cardio', 'laufen', 'joggen', 'radfahren', 'schwimmen', 'hiit',
      // Concepts
      'aufwärmen', 'stretching', 'deload', 'progressive', 'overload',
      'periodisierung', 'ausdauer', 'kraft', 'muskelaufbau', 'hypertrophie',
      // Plan creation
      'plan', 'wochenplan', 'erstell',
      // English
      'exercise', 'lift', 'run', 'warmup',
    ],
  },

  // ── Substance (highest weight — safety-critical!) ──
  {
    agent: 'substance',
    weight: 0.9,
    keywords: [
      // Testosterone
      'testosteron', 'testo', 'trt', 'enanthat', 'cypionat', 'propionat',
      'undecanoat', 'ester', 'halbwertszeit',
      // GLP-1
      'wegovy', 'semaglutid', 'ozempic', 'mounjaro', 'tirzepatid', 'glp-1', 'glp1',
      // Administration
      'substanz', 'substanzen', 'spritze', 'spritzen', 'gespritzt', 'genommen',
      'injektion', 'injizieren', 'injiziert', 'nadel', 'ampulle',
      'rotationsstelle', 'injektionsstelle', 'gluteus', 'delt', 'quad',
      'ventro', 'subkutan',
      // Dosing
      'dosis', 'dosierung', 'titration', 'nebenwirkung', 'nebenwirkungen',
      // Cycling
      'zyklus', 'cycle', 'blast', 'cruise', 'pct',
      'aromatasehemmer', 'hcg',
      // AAS / PED specific
      'anabolika', 'steroide', 'steroid', 'nandrolon', 'deca',
      'trenbolon', 'tren', 'boldenon', 'equipoise',
      'oxandrolon', 'anavar', 'stanozolol', 'winstrol',
      'oxymetholon', 'anadrol', 'dianabol',
      'sarm', 'sarms', 'ostarine', 'ligandrol',
      'wachstumshormon', 'hgh', 'igf',
      'insulin', 'clenbuterol', 'clen', 'ephedrin',
      'diuretika', 'furosemid',
      'myonuklei', 'muscle memory',
      // Blood work
      'blutbild', 'blutwerte', 'hämatokrit', 'estradiol', 'psa',
      'leberwerte', 'lipide', 'cholesterin', 'marker',
      // Blood pressure
      'blutdruck', 'systolisch', 'diastolisch', 'hypertonie',
      // Medical
      'blutspende', 'arzt', 'medikament', 'wechselwirkung',
      // Reminders & Management
      'erinnerung', 'erinnere', 'erinnern', 'reminder', 'vergesse', 'vergessen',
      'anlegen', 'hinzufügen',
      // Supplements (routed to substance agent for add_substance)
      'kreatin', 'creatine', 'supplement', 'supplements',
      'nahrungsergänzung', 'nahrungsergänzungsmittel',
      // English
      'injection', 'needle', 'dose', 'blood pressure', 'blood work',
      'remind', 'reminder', 'creatine', 'supplement',
    ],
  },

  // ── Beauty & Aesthetics ──
  {
    agent: 'beauty',
    weight: 0.85,
    keywords: [
      // Cosmetic procedures (DE)
      'liposuktion', 'lipo', 'fettabsaugung', 'absaugen', 'absaugung',
      'bauchdeckenstraffung', 'abdominoplastik', 'hautstraffung',
      'gynäkomastie', 'gyno', 'brustdrüse',
      'schönheits-op', 'schönheitsop', 'ästhetische', 'ästhetischer',
      'kosmetisch', 'kosmetische', 'plastische', 'plastischer',
      'chirurg', 'chirurgie', 'eingriff', 'operation',
      // HD-Lipo / VASER
      'vaser', 'high-definition', 'hi-def', 'hd-lipo',
      'sixpack-shaping', 'muskelkonturen',
      // Minimally invasive
      'botox', 'filler', 'hyaluronsäure', 'hyaluron',
      'kryolipolyse', 'coolsculpting',
      // Recovery
      'narbe', 'narben', 'heilung', 'komplikation', 'komplikationen',
      'kompressionsmieder', 'ausfallzeit',
      // English
      'liposuction', 'tummy tuck', 'skin tightening', 'cosmetic surgery',
      'plastic surgery', 'gynecomastia', 'coolsculpting',
    ],
  },

  // ── Lifestyle & Attractiveness ──
  {
    agent: 'lifestyle',
    weight: 0.75,
    keywords: [
      // Attractiveness (DE)
      'attraktivität', 'attraktiv', 'attraktiver', 'anziehend',
      'wirkung', 'ausstrahlung', 'charisma', 'auftreten',
      'aussehen', 'optik', 'ästhetik',
      // Social dynamics
      'dating', 'partnersuche', 'flirten', 'beziehung',
      'beruflich', 'karriere', 'bewerbung', 'vorstellungsgespräch',
      'ersteindruck', 'eindruck', 'wirkung',
      // Psychology
      'selbstwert', 'selbstbewusstsein', 'selbstvertrauen', 'selbstbild',
      'körperbild', 'body image', 'psychologie', 'psychologisch',
      'motivation', 'mindset',
      // Styling & Grooming
      'styling', 'kleidung', 'outfit', 'mode', 'fashion',
      'grooming', 'pflege', 'hautpflege', 'frisur', 'bart',
      // Body composition perception
      'proportionen', 'symmetrie', 'v-form',
      'muskulös', 'definiert', 'athletisch',
      // Studies & research
      'studie', 'studien', 'forschung', 'halo-effekt',
      // English
      'attractiveness', 'dating', 'confidence', 'self-esteem',
      'grooming', 'styling', 'first impression', 'body image',
    ],
  },

  // ── Analysis ──
  {
    agent: 'analysis',
    weight: 0.75,
    keywords: [
      // Analysis
      'analyse', 'analysieren', 'auswertung', 'bewertung', 'bewerte',
      'statistik', 'zusammenfassung', 'überblick',
      // Trends
      'trend', 'trends', 'fortschritt', 'entwicklung', 'verlauf',
      'vergleich', 'vergleichen',
      // Time periods
      'woche', 'wochen', 'monat', 'monate', 'letzte', 'diese',
      // Metrics
      'durchschnitt', 'mittelwert', 'bmi', 'kfa', 'körperfett',
      'ffmi', 'magermasse', 'lean',
      'gewichtsverlauf', 'gewichtsentwicklung', 'recomp', 'rekomposition',
      // Calculations
      'tdee', 'bmr', 'grundumsatz', 'kaloriendefizit',
      // Recommendations
      'empfehlung', 'empfehlungen', 'tipp', 'tipps', 'verbesserung',
      'optimierung', 'optimieren',
      // Queries
      'wie läuft', 'wie laufe', 'wie geht', 'zeig mir', 'status',
      // Daily evaluation
      'tagesauswertung', 'tagesbilanz', 'tagesbewertung', 'tag auswerten',
      'tagesstand', 'tagesübersicht',
      // Progress
      'progress', 'summary', 'overview', 'analyze', 'recommend',
      'daily evaluation', 'day summary', 'evaluate my day',
    ],
  },

  // ── Medical (general health, NOT substance-specific) ──
  {
    agent: 'medical',
    weight: 0.85,
    keywords: [
      // Organs & systems (DE)
      'herz', 'herz-kreislauf', 'kardiovaskulär', 'herzinfarkt', 'schlaganfall',
      'leber', 'niere', 'nieren', 'schilddrüse', 'thyroid',
      'prostata', 'gelenke', 'sehnen', 'knochen', 'knorpel',
      'immunsystem', 'stoffwechsel', 'metabolismus',
      // Medical conditions
      'diabetes', 'insulinresistenz', 'metabolisches syndrom',
      'arthrose', 'osteoporose', 'gicht', 'rheuma',
      'schlafapnoe', 'apnoe', 'asthma',
      // Lab values & diagnostics
      'laborwerte', 'blutwerte', 'blutbild', 'hba1c', 'tsh',
      'gfr', 'kreatinin', 'got', 'gpt', 'ggt', 'gamma-gt',
      'triglyceride', 'ldl', 'hdl', 'lipidprofil',
      'vitamin d', 'ferritin', 'eisen', 'zink', 'magnesium',
      // Medical advice
      'gesundheit', 'gesundheitlich', 'medizinisch',
      'symptom', 'symptome', 'diagnose', 'vorsorge', 'check-up',
      'warnsignal', 'warnsignale', 'risiko', 'risiken', 'risikofaktor',
      'prävention', 'vorbeugung',
      // Age-related
      'alter', 'altern', 'alterung', 'regeneration', 'regenerationsfähigkeit',
      // Cardiovascular health
      'puls', 'ruhepuls', 'herzfrequenz', 'herzrhythmus',
      'arteriosklerose', 'atherosklerose', 'thrombose',
      'brustschmerz', 'atemnot',
      // Nutritional medicine
      'mikronährstoff', 'mikronährstoffe', 'nährstoffmangel',
      'malabsorption', 'unverträglichkeit', 'allergie',
      // Drug interactions (general)
      'wechselwirkung', 'kontraindikation', 'nebenwirkung gesundheit',
      // English
      'health', 'medical', 'cardiovascular', 'heart', 'liver', 'kidney',
      'thyroid', 'diabetes', 'blood test', 'lab values', 'symptoms',
      'side effects health', 'warning signs', 'prevention',
    ],
  },
];

// ── Greeting / Small Talk Detection ─────────────────────────────────────

const GREETING_PATTERNS = [
  /^(hi|hallo|hey|moin|servus|guten\s*(morgen|tag|abend)|na\??|was\s*geht|yo)[\s!?.]*$/i,
  /^(hello|good\s*(morning|evening|afternoon))[\s!?.]*$/i,
  /^(wie\s*geht'?s|wie\s*geht\s*es\s*dir|alles\s*klar)[\s!?.]*$/i,
  /^(danke|vielen\s*dank|thanks|thank\s*you)[\s!?.]*$/i,
  /^(tschüss|bye|ciao|bis\s*dann|bis\s*später)[\s!?.]*$/i,
];

// ── Router Logic ────────────────────────────────────────────────────────

// Lower threshold to catch short messages like "Skyr und Orangen" or "TRT Spritze"
// With ~80 nutrition keywords: 1 match scores 0.8*(1/√80) = 0.089
// With ~40 substance keywords: 1 match scores 0.9*(1/√40) = 0.142
// → threshold 0.12 ensures even a single keyword match routes correctly
const CONFIDENCE_THRESHOLD = 0.12;

/**
 * Detect intent from a user message using keyword scoring.
 * Returns which agent should handle the message.
 */
export function detectIntent(userMessage: string): RoutingDecision {
  const normalized = userMessage.toLowerCase().trim();

  // 1. Short-circuit: greetings → general agent
  for (const pattern of GREETING_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        targetAgent: 'general',
        confidence: 1.0,
        matchedKeywords: ['greeting'],
      };
    }
  }

  // 2. Score each agent based on keyword matches
  const scores: { agent: AgentType; score: number; matches: string[] }[] = [];

  for (const rule of ROUTING_RULES) {
    const matches: string[] = [];
    for (const keyword of rule.keywords) {
      if (normalized.includes(keyword)) {
        matches.push(keyword);
      }
    }
    if (matches.length > 0) {
      // Normalize: weight × (matched / √total) — prevents large keyword lists from dominating
      const score = rule.weight * (matches.length / Math.sqrt(rule.keywords.length));
      scores.push({ agent: rule.agent, score, matches });
    }
  }

  // 3. Pick highest scoring agent
  if (scores.length > 0) {
    scores.sort((a, b) => b.score - a.score);
    const best = scores[0];

    if (best.score >= CONFIDENCE_THRESHOLD) {
      return {
        targetAgent: best.agent,
        confidence: Math.min(best.score, 1.0),
        matchedKeywords: best.matches,
      };
    }
  }

  // 4. Fallback → general agent
  return {
    targetAgent: 'general',
    confidence: 0.5,
    matchedKeywords: [],
    reasoning: 'No strong keyword match — using general agent',
  };
}

/**
 * Detect ALL matching intents from a user message.
 * Returns multiple agents when a message spans domains (e.g. "Kekse und TRT Spritze").
 * Primary agent gets streaming, additional agents run blocking.
 */
export function detectMultiIntent(userMessage: string): MultiRoutingDecision {
  const normalized = userMessage.toLowerCase().trim();

  // 1. Short-circuit: greetings → only general agent
  for (const pattern of GREETING_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        agents: [{ targetAgent: 'general', confidence: 1.0, matchedKeywords: ['greeting'] }],
        primaryAgent: 'general',
      };
    }
  }

  // 2. Score ALL agents
  const scores: RoutingDecision[] = [];

  for (const rule of ROUTING_RULES) {
    const matches: string[] = [];
    for (const keyword of rule.keywords) {
      if (normalized.includes(keyword)) {
        matches.push(keyword);
      }
    }
    if (matches.length > 0) {
      const score = rule.weight * (matches.length / Math.sqrt(rule.keywords.length));
      if (score >= CONFIDENCE_THRESHOLD) {
        scores.push({
          targetAgent: rule.agent,
          confidence: Math.min(score, 1.0),
          matchedKeywords: matches,
        });
      }
    }
  }

  // 3. No matches → general fallback
  if (scores.length === 0) {
    return {
      agents: [{ targetAgent: 'general', confidence: 0.5, matchedKeywords: [] }],
      primaryAgent: 'general',
    };
  }

  // 4. Sort by confidence (highest first)
  scores.sort((a, b) => b.confidence - a.confidence);

  // 5. Analysis agent runs ALONE (needs holistic view, not partial)
  if (scores[0].targetAgent === 'analysis') {
    return { agents: [scores[0]], primaryAgent: 'analysis' };
  }

  // 6. Return ALL agents above threshold — multi-agent dispatch!
  return {
    agents: scores,
    primaryAgent: scores[0].targetAgent,
  };
}

/**
 * Main entry point: route user message to the correct agent and get a response.
 * Uses blocking mode — prefer routeAndExecuteStream() for interactive chat.
 */
export async function routeAndExecute(
  userMessage: string,
  context: AgentContext,
): Promise<AgentResult> {
  const decision = detectIntent(userMessage);
  const agent = getAgent(decision.targetAgent);

  // Add the user message to conversation history for the agent
  const fullContext: AgentContext = {
    ...context,
    conversationHistory: [
      ...context.conversationHistory,
      { role: 'user', content: userMessage },
    ],
  };

  const result = await agent.execute(fullContext);

  return result;
}

/**
 * Streaming entry point with MULTI-AGENT support.
 *
 * Single domain: streams normally (one agent).
 * Multi domain (e.g. "Kekse und TRT"): primary agent streams live,
 * additional agents run blocking, results are combined into one response.
 *
 * onChunk is called with accumulated text as tokens arrive.
 */
export async function routeAndExecuteStream(
  userMessage: string,
  context: AgentContext,
  onChunk: StreamCallback,
): Promise<AgentResult> {
  const decision = detectMultiIntent(userMessage);

  const fullContext: AgentContext = {
    ...context,
    conversationHistory: [
      ...context.conversationHistory,
      { role: 'user', content: userMessage },
    ],
  };

  // ── SINGLE AGENT (most common case): stream as before ──
  if (decision.agents.length <= 1) {
    const agent = getAgent(decision.primaryAgent);
    return agent.executeStream(fullContext, onChunk);
  }

  // ── MULTI-AGENT: primary streams, additional agents run blocking ──
  const primaryAgent = getAgent(decision.primaryAgent);
  const primaryResult = await primaryAgent.executeStream(fullContext, onChunk);

  // Collect results from all additional agents
  const additionalResults: AgentResult[] = [];

  for (let i = 1; i < decision.agents.length; i++) {
    const agentType = decision.agents[i].targetAgent;
    const agent = getAgent(agentType);
    try {
      const result = await agent.execute(fullContext);
      additionalResults.push(result);
    } catch (err) {
      console.error(`Multi-agent: ${agentType} failed:`, err);
    }
  }

  // If no additional results, just return primary
  if (additionalResults.length === 0) {
    return primaryResult;
  }

  // Combine: primary content + separator + each additional agent's content
  let combinedContent = primaryResult.content;
  const allVersions = { ...primaryResult.skillVersions };

  for (const result of additionalResults) {
    combinedContent += `\n\n---\n${result.agentIcon} **${result.agentName}:**\n${result.content}`;
    Object.assign(allVersions, result.skillVersions);
  }

  // Push final combined content to UI
  onChunk(combinedContent);

  return {
    content: combinedContent,
    agentType: primaryResult.agentType,
    agentName: primaryResult.agentName,
    agentIcon: primaryResult.agentIcon,
    skillVersions: allVersions,
    tokensUsed: (primaryResult.tokensUsed ?? 0) +
      additionalResults.reduce((sum, r) => sum + (r.tokensUsed ?? 0), 0),
    model: primaryResult.model,
  };
}
