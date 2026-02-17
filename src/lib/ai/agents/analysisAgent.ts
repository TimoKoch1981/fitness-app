/**
 * Analysis Agent — Gesundheitscoach & Daten-Analyst
 *
 * Handles: trend analysis, progress reports, health data interpretation,
 * body composition assessment, calorie balance, recommendations.
 *
 * This agent loads the MOST user skills because it needs a holistic view.
 *
 * Skills loaded: analysis (static) + profile, nutrition_log, training_log, body_progress, substance_protocol (user)
 */

import { BaseAgent } from './baseAgent';
import type { AgentConfig } from './types';

const CONFIG: AgentConfig = {
  type: 'analysis',
  name: 'Analyse-Agent',
  nameEN: 'Analysis Agent',
  icon: '📊',
  staticSkills: ['analysis'],
  userSkills: ['profile', 'nutrition_log', 'training_log', 'body_progress', 'substance_protocol'],
  maxContextTokens: 4500,
  description: 'Spezialist für Datenanalyse, Trend-Erkennung, Fortschrittsbewertung und Empfehlungen',
};

export class AnalysisAgent extends BaseAgent {
  constructor() {
    super(CONFIG);
  }

  protected buildRoleHeader(language: 'de' | 'en'): string {
    if (language === 'de') {
      return `Du bist der FitBuddy Analyse-Agent — Gesundheitscoach mit Fokus auf Datenanalyse und Fortschrittsbewertung.
Du antwortest immer auf Deutsch. Halte dich kurz (3-4 Sätze), kannst aber bei Analyse-Anfragen ausführlicher werden.
Du analysierst die Gesundheitsdaten des Nutzers, erkennst Trends und gibst evidenzbasierte Empfehlungen.
Du beziehst aktive Substanzen, Ernährung und Training ganzheitlich in die Analyse ein.`;
    }
    return `You are the FitBuddy Analysis Agent — health coach focused on data analysis and progress assessment.
Always respond in English. Keep responses concise (3-4 sentences), but expand for analysis requests.
You analyze the user's health data, detect trends, and give evidence-based recommendations.
You consider active substances, nutrition, and training holistically in your analysis.`;
  }

  protected getAgentInstructions(language: 'de' | 'en'): string | null {
    if (language === 'de') {
      return `## ZUSÄTZLICHE REGELN
- Zahlen und Trends immer mit Kontext geben
- Erst was gut läuft erwähnen, dann Verbesserungsvorschläge
- Maximal 2-3 Empfehlungen pro Analyse (priorisiert)
- Empfehlungen müssen konkret und umsetzbar sein
- Emojis für schnelle Einordnung: ✅ gut, 🟡 beachten, 🔴 handeln
- Bei Blutdruck-Auffälligkeiten: Arzt-Empfehlung`;
    }
    return null;
  }
}
