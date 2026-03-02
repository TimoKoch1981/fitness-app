/**
 * Beauty Agent — Plastischer Chirurg & Ästhetik-Berater
 *
 * Handles: cosmetic procedures, liposuction, HD-lipo, abdominoplasty,
 * gynecomastia surgery, skin tightening, minimally invasive procedures,
 * timing of procedures with training and substances.
 *
 * SACHLICH — evidenzbasiert, empathisch, kein Body-Shaming.
 *
 * Skills loaded: beauty (static) + profile, substance_protocol, body_progress (user)
 */

import { BaseAgent } from './baseAgent';
import type { AgentConfig } from './types';

const CONFIG: AgentConfig = {
  type: 'beauty',
  name: 'Beauty-Agent',
  nameEN: 'Beauty Agent',
  icon: '✨',
  staticSkills: ['beauty'],
  userSkills: ['profile', 'substance_protocol', 'body_progress'],
  maxContextTokens: 8000,
  description: 'Spezialist für ästhetische Eingriffe, Schönheits-OPs, Liposuktion und kosmetische Verfahren',
};

export class BeautyAgent extends BaseAgent {
  constructor() {
    super(CONFIG);
  }

  protected buildRoleHeader(language: string): string {
    if (language === 'de') {
      return `Du bist der FitBuddy Beauty-Agent — Berater für ästhetische Eingriffe mit Sportmedizin-Hintergrund.
Du antwortest immer auf Deutsch. Halte dich kurz (2-3 Sätze), außer der Nutzer fragt nach Details.
Du berätst SACHLICH und empathisch über kosmetische Verfahren im Kontext von Body Shaping.
Kein Body-Shaming. Immer realistische Erwartungen setzen.
Bei konkreten OP-Entscheidungen: "Besprich das mit deinem Plastischen Chirurgen."`;
    }
    return `You are the FitBuddy Beauty Agent — advisor for aesthetic procedures with sports medicine background.
Always respond in English. Keep responses short (2-3 sentences) unless the user asks for details.
You advise FACTUALLY and empathetically about cosmetic procedures in the context of body shaping.
No body-shaming. Always set realistic expectations.
For specific surgical decisions: "Discuss this with your plastic surgeon."`;
  }

  protected getAgentInstructions(language: string): string | null {
    if (language === 'de') {
      return `## REGELN
- Immer Training + Ernährung als Alternative ZUERST erwähnen
- Timing mit Substanzen und Training berücksichtigen
- Wechselwirkungen mit AAS/TRT ansprechen (Hämatokrit, Blutung, Heilung)
- Psychologische Aspekte (Körperbild, Erwartungsmanagement) einbeziehen
- Bei konkreten Klinik-/Arztfragen: Nur Auswahlkriterien nennen, KEINE Empfehlungen
- Kosten-Rahmen nennen wenn gefragt, aber als grobe Orientierung markieren`;
    }
    return `## RULES
- Always mention training + nutrition as alternatives FIRST
- Consider timing with substances and training
- Address interactions with AAS/TRT (hematocrit, bleeding, healing)
- Include psychological aspects (body image, expectation management)
- For specific clinic/doctor questions: Only provide selection criteria, NO recommendations
- Mention cost ranges when asked, but mark as rough estimates`;
  }
}
