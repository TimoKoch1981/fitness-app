/**
 * Context Extractor — Rule-based extraction of key facts from chat messages.
 *
 * Extracts health issues, goals, preferences, and recommendations from
 * user messages and agent responses. No LLM required — uses keyword matching.
 *
 * Extracted notes are stored in `buddy_context_notes` for cross-session persistence.
 */

import { supabase } from '../supabase';

export type ContextNoteType =
  | 'health_issue'
  | 'goal'
  | 'preference'
  | 'recommendation'
  | 'topic'
  | 'substance_change';

export interface ContextNote {
  note_type: ContextNoteType;
  content: string;
  agent_type: string;
}

// ── Health Issue Patterns ─────────────────────────────────────────────────
const HEALTH_PATTERNS_DE = [
  /(?:habe|hab|melde|spuere?|fuehle?)\s+(?:.*?)(?:schmerz|weh|probleme?|beschwerden)/i,
  /(?:knie|schulter|ruecken|nacken|hueft|handgelenk|knoechel|kopf)\s*(?:schmerz|probleme?|tut\s+weh)/i,
  /(?:bin|wurde?|fuehl\s+mich)\s+(?:krank|verletzt|muede|erschoepft)/i,
  /(?:diagnose|diagnostiziert|festgestellt)\s*[:.]?\s*(.+)/i,
  /(?:allergi|unvertraeglichkeit|intoleran)\s+(?:gegen\s+)?(.+)/i,
];

const HEALTH_PATTERNS_EN = [
  /(?:have|feel|experiencing?|suffering)\s+(?:.*?)(?:pain|ache|problem|issue|injury)/i,
  /(?:knee|shoulder|back|neck|hip|wrist|ankle|head)\s*(?:pain|problem|hurts?|ache)/i,
  /(?:am|feel|feeling)\s+(?:sick|injured|tired|exhausted|fatigued)/i,
  /(?:diagnosed|diagnosis|found out)\s*[:.]?\s*(.+)/i,
  /(?:allerg|intoleran)\s+(?:to\s+)?(.+)/i,
];

// ── Goal Patterns ──────────────────────────────────────────────────────────
const GOAL_PATTERNS_DE = [
  /(?:will|moechte?|ziel|plane?)\s+(?:.*?)(?:\d+\s*(?:kg|kilo)|abnehmen|zunehmen|aufbauen|erreichen)/i,
  /(?:ziel|target)\s*(?:ist|:)\s*(.+)/i,
  /(?:bis|innerhalb|in)\s+(?:\d+\s*(?:wochen?|monate?|tagen?))\s+(?:.*?)(?:schaffen|erreichen|wiegen)/i,
  /(?:bankdrueck|kniebeu|kreuzhe|squat|bench|deadlift)\s*(?:.*?)(\d+\s*kg)/i,
];

const GOAL_PATTERNS_EN = [
  /(?:want|goal|plan|aim)\s+(?:.*?)(?:\d+\s*(?:kg|lbs?|pounds?)|lose|gain|build|achieve)/i,
  /(?:goal|target)\s*(?:is|:)\s*(.+)/i,
  /(?:within|in)\s+(?:\d+\s*(?:weeks?|months?|days?))\s+(?:.*?)(?:achieve|reach|weigh)/i,
  /(?:bench|squat|deadlift)\s*(?:.*?)(\d+\s*(?:kg|lbs?))/i,
];

// ── Preference Patterns ────────────────────────────────────────────────────
const PREFERENCE_PATTERNS_DE = [
  /(?:mag|esse?|vertrage?)\s+(?:kein(?:e|en)?|nicht?)\s+(.+)/i,
  /(?:bin|esse?)\s+(?:vegetari|vegan|pescetari|laktosefrei|glutenfrei)/i,
  /(?:trainier|sport)\s+(?:.*?)(?:morgens?|abends?|mittags?|fruehs?)/i,
  /(?:bevorzuge?|lieber|am\s+liebsten)\s+(.+)/i,
];

const PREFERENCE_PATTERNS_EN = [
  /(?:don'?t|can'?t)\s+(?:eat|like|tolerate)\s+(.+)/i,
  /(?:am|eat)\s+(?:vegetarian|vegan|pescatarian|lactose.free|gluten.free)/i,
  /(?:train|workout|exercise)\s+(?:.*?)(?:morning|evening|afternoon|early)/i,
  /(?:prefer|like|rather)\s+(.+)/i,
];

// ── Substance Change Patterns ──────────────────────────────────────────────
const SUBSTANCE_PATTERNS_DE = [
  /(?:nehme?|starte?|beginn|abgesetzt|erhoeh|reduzier|geaendert)\s+(?:.*?)(?:testo|trt|semaglutid|wegovy|kreatin|whey|omega|vitamin)/i,
  /(?:dosis|dosierung)\s+(?:.*?)(?:erhoeh|reduzier|geaendert|angepass)/i,
  /(?:pct|absetzen|off.?cycle|cruise|blast)\s+(?:.*?)(?:start|beginn|seit|plane)/i,
];

const SUBSTANCE_PATTERNS_EN = [
  /(?:start|stop|increas|decreas|change)\s+(?:.*?)(?:testo|trt|semaglutide|wegovy|creatine|whey|omega|vitamin)/i,
  /(?:dose|dosage)\s+(?:.*?)(?:increas|decreas|change|adjust)/i,
  /(?:pct|come\s+off|off.?cycle|cruise|blast)\s+(?:.*?)(?:start|since|plan)/i,
];

/**
 * Extract context notes from a user message.
 * Returns an array of extracted notes (may be empty).
 */
export function extractFromUserMessage(
  message: string,
  language: 'de' | 'en',
  agentType: string,
): ContextNote[] {
  const notes: ContextNote[] = [];
  const msg = message.trim();

  // Skip very short messages (likely quick replies, not context-rich)
  if (msg.length < 15) return notes;

  const healthPatterns = language === 'de' ? HEALTH_PATTERNS_DE : HEALTH_PATTERNS_EN;
  const goalPatterns = language === 'de' ? GOAL_PATTERNS_DE : GOAL_PATTERNS_EN;
  const prefPatterns = language === 'de' ? PREFERENCE_PATTERNS_DE : PREFERENCE_PATTERNS_EN;
  const substancePatterns = language === 'de' ? SUBSTANCE_PATTERNS_DE : SUBSTANCE_PATTERNS_EN;

  // Check each pattern category
  for (const pattern of healthPatterns) {
    if (pattern.test(msg)) {
      notes.push({
        note_type: 'health_issue',
        content: msg.slice(0, 200), // Cap at 200 chars
        agent_type: agentType,
      });
      break; // One note per category per message
    }
  }

  for (const pattern of goalPatterns) {
    if (pattern.test(msg)) {
      notes.push({
        note_type: 'goal',
        content: msg.slice(0, 200),
        agent_type: agentType,
      });
      break;
    }
  }

  for (const pattern of prefPatterns) {
    if (pattern.test(msg)) {
      notes.push({
        note_type: 'preference',
        content: msg.slice(0, 200),
        agent_type: agentType,
      });
      break;
    }
  }

  for (const pattern of substancePatterns) {
    if (pattern.test(msg)) {
      notes.push({
        note_type: 'substance_change',
        content: msg.slice(0, 200),
        agent_type: agentType,
      });
      break;
    }
  }

  return notes;
}

/**
 * Extract recommendation context from an agent response.
 * Only extracts if the agent gave a specific actionable recommendation.
 */
export function extractFromAgentResponse(
  response: string,
  language: 'de' | 'en',
  agentType: string,
): ContextNote[] {
  const notes: ContextNote[] = [];

  // Extract specific recommendations (not general chit-chat)
  const recPatternsDe = [
    /(?:empfehl|schlage?\s+vor|rate?\s+dir|solltest)\s*(?:.*?)(?:deload|pause|ruhetag|arzt|physio|erholung)/i,
    /(?:wichtig|achtung|bitte\s+beachte)\s*[:.]?\s*(.{20,})/i,
  ];

  const recPatternsEn = [
    /(?:recommend|suggest|advise|should)\s*(?:.*?)(?:deload|rest|doctor|physio|recovery)/i,
    /(?:important|attention|please\s+note)\s*[:.]?\s*(.{20,})/i,
  ];

  const patterns = language === 'de' ? recPatternsDe : recPatternsEn;

  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match) {
      // Extract the relevant sentence (not the whole response)
      const sentenceEnd = response.indexOf('.', match.index ?? 0);
      const sentence = response.slice(
        match.index ?? 0,
        sentenceEnd > 0 ? sentenceEnd + 1 : (match.index ?? 0) + 200,
      ).trim();

      if (sentence.length > 20) {
        notes.push({
          note_type: 'recommendation',
          content: sentence.slice(0, 300),
          agent_type: agentType,
        });
        break;
      }
    }
  }

  return notes;
}

/**
 * Save extracted context notes to Supabase.
 * Deduplicates: skips if very similar content was already saved today.
 */
export async function saveContextNotes(
  userId: string,
  notes: ContextNote[],
): Promise<void> {
  if (notes.length === 0) return;

  try {
    // Fetch today's existing notes to avoid duplicates
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('buddy_context_notes')
      .select('content, note_type')
      .eq('user_id', userId)
      .eq('session_date', today);

    const existingSet = new Set(
      (existing ?? []).map(e => `${e.note_type}:${e.content.slice(0, 50)}`),
    );

    // Filter out duplicates
    const newNotes = notes.filter(
      n => !existingSet.has(`${n.note_type}:${n.content.slice(0, 50)}`),
    );

    if (newNotes.length === 0) return;

    // Insert new notes
    const { error } = await supabase.from('buddy_context_notes').insert(
      newNotes.map(n => ({
        user_id: userId,
        agent_type: n.agent_type,
        note_type: n.note_type,
        content: n.content,
        session_date: today,
      })),
    );

    if (error) {
      console.warn('[ContextExtractor] Failed to save notes:', error.message);
    }
  } catch (err) {
    // Non-critical — don't crash the chat if context saving fails
    console.warn('[ContextExtractor] Error:', err);
  }
}

/**
 * Load recent context notes for a user, formatted for agent system prompt.
 * Returns null if no relevant context exists.
 */
export async function loadPersistentContext(
  userId: string,
  agentType: string,
  language: 'de' | 'en' = 'de',
  limit: number = 10,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('buddy_context_notes')
      .select('note_type, content, session_date, agent_type')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .or(`agent_type.eq.${agentType},agent_type.eq.general`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) return null;

    const de = language === 'de';
    const typeLabels: Record<string, string> = de
      ? {
          health_issue: 'Gesundheit',
          goal: 'Ziel',
          preference: 'Praeferenz',
          recommendation: 'Empfehlung',
          topic: 'Thema',
          substance_change: 'Substanz',
        }
      : {
          health_issue: 'Health',
          goal: 'Goal',
          preference: 'Preference',
          recommendation: 'Recommendation',
          topic: 'Topic',
          substance_change: 'Substance',
        };

    let block = de
      ? `\n## 🧠 KONTEXT AUS FRUEHEREN GESPRAECHEN\n`
      : `\n## 🧠 CONTEXT FROM PREVIOUS CONVERSATIONS\n`;
    block += de
      ? `> Beruecksichtige diese Informationen aus frueheren Sitzungen.\n\n`
      : `> Consider this information from previous sessions.\n\n`;

    for (const note of data) {
      const label = typeLabels[note.note_type] ?? note.note_type;
      block += `- [${label}] (${note.session_date}): ${note.content}\n`;
    }

    return block;
  } catch {
    return null;
  }
}

/**
 * Delete expired context notes (cleanup utility).
 * Can be called periodically or on app startup.
 */
export async function cleanupExpiredNotes(userId: string): Promise<void> {
  try {
    await supabase
      .from('buddy_context_notes')
      .delete()
      .eq('user_id', userId)
      .lt('expires_at', new Date().toISOString());
  } catch {
    // Non-critical
  }
}
