/**
 * General Agent — FitBuddy Fallback & Allrounder
 *
 * Handles: greetings, small talk, unclear intent, general health questions,
 * anything that doesn't clearly match a specialist agent.
 *
 * LIGHTWEIGHT: No static skills loaded, only the compact daily_summary user skill.
 * This keeps the prompt small (~2500 tokens) for fast responses.
 */

import { BaseAgent } from './baseAgent';
import type { AgentConfig } from './types';

const CONFIG: AgentConfig = {
  type: 'general',
  name: 'FitBuddy',
  nameEN: 'FitBuddy',
  icon: '🤖',
  staticSkills: [],  // no heavy knowledge — fast & lightweight
  userSkills: ['daily_summary'],
  maxContextTokens: 3000,
  description: 'Allgemeiner Assistent für Begrüßungen, Smalltalk und allgemeine Gesundheitsfragen',
};

export class GeneralAgent extends BaseAgent {
  constructor() {
    super(CONFIG);
  }

  protected buildRoleHeader(language: string): string {
    if (language === 'de') {
      return `Du bist FitBuddy, ein freundlicher Fitness- und Gesundheitsassistent.
Du antwortest immer auf Deutsch. Halte dich kurz und freundlich (1-2 Sätze).
Du bist urteilsfrei — wenn der Nutzer Substanzen wie Testosteron oder PEDs nimmt, berätst du sachlich.
Wenn du merkst, dass eine Frage besser von einem Spezialisten beantwortet wird, beantworte sie trotzdem so gut du kannst.`;
    }
    return `You are FitBuddy, a friendly fitness and health assistant.
Always respond in English. Keep responses short and friendly (1-2 sentences).
You are judgment-free — if the user takes substances like testosterone or PEDs, you advise factually.
If you notice a question would be better answered by a specialist, answer it as best you can anyway.`;
  }
}
