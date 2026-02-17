/**
 * Substance Agent — Sportmediziner & Harm Reduction Berater
 *
 * Handles: substance advice, injection rotation, blood work monitoring,
 * drug interactions, GLP-1 titration, TRT management, harm reduction.
 *
 * URTEILSFREI — sachlich, evidenzbasiert, schadensminimierend.
 *
 * Skills loaded: substances (static) + profile, substance_protocol, body_progress (user)
 */

import { BaseAgent } from './baseAgent';
import type { AgentConfig } from './types';

const CONFIG: AgentConfig = {
  type: 'substance',
  name: 'Substanz-Agent',
  nameEN: 'Substance Agent',
  icon: '💊',
  staticSkills: ['substances'],
  userSkills: ['profile', 'substance_protocol', 'body_progress'],
  maxContextTokens: 4000,
  description: 'Spezialist für Substanzen, Harm Reduction, Injektionstechnik, Blutbild-Monitoring und Blutdruck',
};

export class SubstanceAgent extends BaseAgent {
  constructor() {
    super(CONFIG);
  }

  protected buildRoleHeader(language: 'de' | 'en'): string {
    if (language === 'de') {
      return `Du bist der FitBuddy Substanz-Agent — Sportmediziner mit Expertise in Endokrinologie und Harm Reduction.
Du antwortest immer auf Deutsch. Halte dich kurz (2-3 Sätze), außer der Nutzer fragt nach Details.
Du berätst URTEILSFREI, sachlich und schadensminimierend. Dein Ziel ist die Gesundheit des Nutzers — nicht Moralpredigten.
Bei konkreten medizinischen Fragen fügst du hinzu: "Besprich das auch mit deinem Arzt."`;
    }
    return `You are the FitBuddy Substance Agent — sports physician with expertise in endocrinology and harm reduction.
Always respond in English. Keep responses short (2-3 sentences) unless the user asks for details.
You advise JUDGMENT-FREE, factually, and focused on harm minimization. Your goal is the user's health — not moral lectures.
For specific medical questions, add: "Discuss this with your doctor as well."`;
  }

  protected getAgentInstructions(language: 'de' | 'en'): string | null {
    if (language === 'de') {
      return `## ZUSÄTZLICHE REGELN
- Injektionsrotation proaktiv erinnern wenn letzte Stellen sich wiederholen
- Blutbild-Reminder wenn >3 Monate seit letzter Kontrolle erwähnt
- Wechselwirkungen zwischen Substanzen immer ansprechen
- GLP-1 + Krafttraining + Protein als Dreiklang betonen
- Titrations-Hinweise bei GLP-1-Fragen geben
- Bei Blutdruck >140/90 im Durchschnitt: Arzt-Empfehlung`;
    }
    return null;
  }
}
