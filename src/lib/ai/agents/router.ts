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

import type { AgentType, RoutingDecision, AgentContext, AgentResult } from './types';
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
      // Food & eating
      'essen', 'gegessen', 'esse', 'mahlzeit', 'frühstück', 'mittagessen', 'abendessen',
      'snack', 'hunger', 'satt', 'portion', 'rezept', 'kochen',
      // Macros & nutrients
      'kalorien', 'kcal', 'protein', 'eiweiß', 'kohlenhydrate', 'carbs',
      'fett', 'makros', 'nährwerte', 'nährwert', 'ballaststoffe', 'fiber',
      // Nutrition planning
      'ernährung', 'ernährungs', 'ernährungsplan', 'diät', 'abnehmen', 'zunehmen',
      'kalorienziel', 'proteinziel', 'defizit', 'überschuss',
      // Hydration
      'trinken', 'wasser', 'getränk', 'hydration',
      // Supplements
      'supplement', 'whey', 'kreatin', 'creatine', 'vitamin', 'omega',
      // Common foods (German)
      'hühnchen', 'hähnchen', 'reis', 'nudeln', 'brot', 'müsli', 'joghurt',
      'quark', 'obst', 'gemüse', 'salat', 'pizza', 'burger', 'ei', 'eier',
      'lachs', 'thunfisch', 'kartoffeln', 'haferflocken', 'shake',
      // English fallbacks
      'meal', 'food', 'eat', 'ate', 'nutrition', 'calories', 'macros',
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
      'substanz', 'substanzen', 'spritze', 'spritzen',
      'injektion', 'injizieren', 'injiziert', 'nadel', 'ampulle',
      'rotationsstelle', 'injektionsstelle', 'gluteus', 'delt', 'quad',
      'ventro', 'subkutan',
      // Dosing
      'dosis', 'dosierung', 'titration', 'nebenwirkung', 'nebenwirkungen',
      // Cycling
      'zyklus', 'cycle', 'blast', 'cruise', 'pct',
      'aromatasehemmer', 'hcg',
      // Blood work
      'blutbild', 'blutwerte', 'hämatokrit', 'estradiol', 'psa',
      'leberwerte', 'lipide', 'cholesterin', 'marker',
      // Blood pressure
      'blutdruck', 'systolisch', 'diastolisch', 'hypertonie',
      // Medical
      'blutspende', 'arzt', 'medikament', 'wechselwirkung',
      // English
      'injection', 'needle', 'dose', 'blood pressure', 'blood work',
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
      // Progress
      'progress', 'summary', 'overview', 'analyze', 'recommend',
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

const CONFIDENCE_THRESHOLD = 0.3;

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
 * Streaming entry point: route user message and stream the response.
 * onChunk is called with accumulated text as tokens arrive.
 */
export async function routeAndExecuteStream(
  userMessage: string,
  context: AgentContext,
  onChunk: StreamCallback,
): Promise<AgentResult> {
  const decision = detectIntent(userMessage);
  const agent = getAgent(decision.targetAgent);

  const fullContext: AgentContext = {
    ...context,
    conversationHistory: [
      ...context.conversationHistory,
      { role: 'user', content: userMessage },
    ],
  };

  const result = await agent.executeStream(fullContext, onChunk);

  return result;
}
