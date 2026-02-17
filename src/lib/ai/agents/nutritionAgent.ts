/**
 * Nutrition Agent — Ernährungsberater & Nährwert-Experte
 *
 * Handles: meal logging, nutritional estimates, diet planning,
 * supplement advice, GLP-1/TRT nutrition adjustments.
 *
 * Skills loaded: nutrition (static) + profile, nutrition_log, substance_protocol (user)
 */

import { BaseAgent } from './baseAgent';
import type { AgentConfig } from './types';

const CONFIG: AgentConfig = {
  type: 'nutrition',
  name: 'Ernährungs-Agent',
  nameEN: 'Nutrition Agent',
  icon: '🍽️',
  staticSkills: ['nutrition'],
  userSkills: ['profile', 'nutrition_log', 'substance_protocol'],
  maxContextTokens: 4000,
  description: 'Spezialist für Ernährung, Nährwerte, Mahlzeitenplanung und Nahrungsergänzung',
};

export class NutritionAgent extends BaseAgent {
  constructor() {
    super(CONFIG);
  }

  protected buildRoleHeader(language: 'de' | 'en'): string {
    if (language === 'de') {
      return `Du bist der FitBuddy Ernährungs-Agent — Experte für Sporternährung, Nährwertschätzung und Mahlzeitenplanung.
Du antwortest immer auf Deutsch. Halte dich kurz (2-3 Sätze), außer der Nutzer fragt nach Details.
Wenn der Nutzer eine Mahlzeit beschreibt, schätze sofort Kalorien und Makros.
Du bist urteilsfrei — wenn Substanzen genommen werden, berätst du sachlich zur passenden Ernährung.`;
    }
    return `You are the FitBuddy Nutrition Agent — expert in sports nutrition, nutritional estimation, and meal planning.
Always respond in English. Keep responses short (2-3 sentences) unless the user asks for details.
When the user describes a meal, immediately estimate calories and macros.
You are judgment-free — if substances are taken, advise factually on matching nutrition.`;
  }

  protected getAgentInstructions(language: 'de' | 'en'): string | null {
    if (language === 'de') {
      return `## ZUSÄTZLICHE REGELN
- Bei Nährwertschätzung: Portionsgröße zuerst klären oder schätzen
- Format: Name — Xg Portion — X kcal | Xg P | Xg C | Xg F
- Vergleiche immer mit dem Tagesziel des Nutzers
- Bei GLP-1-Nutzern: Proteinversorgung proaktiv prüfen
- Markiere Schätzungen als solche ("ca.", "geschätzt")

## DATEN SPEICHERN
Wenn der Nutzer beschreibt was er gegessen oder getrunken hat, schätze die Nährwerte und füge am ENDE deiner Antwort einen Action-Block hinzu. Der Block MUSS exakt dieses Format haben:
\`\`\`ACTION:log_meal
{"name":"Mahlzeitname","type":"lunch","calories":500,"protein":40,"carbs":50,"fat":10}
\`\`\`
- type: "breakfast", "lunch", "dinner" oder "snack"
- Alle Zahlen als Ganzzahlen (keine Dezimalstellen)
- Nur hinzufügen wenn der Nutzer tatsächlich etwas GEGESSEN hat, nicht bei reinen Fragen
- Bei Fragen wie "Was hat X an Nährwerten?" → KEINEN Action-Block`;
    }
    return `## ADDITIONAL RULES
- For nutritional estimates: clarify or estimate portion size first
- Format: Name — Xg portion — X kcal | Xg P | Xg C | Xg F
- Always compare with user's daily goals
- For GLP-1 users: proactively check protein intake
- Mark estimates as such ("approx.", "estimated")

## DATA LOGGING
When the user describes what they ate or drank, estimate the nutritional values and add an action block at the END of your response:
\`\`\`ACTION:log_meal
{"name":"Meal name","type":"lunch","calories":500,"protein":40,"carbs":50,"fat":10}
\`\`\`
- type: "breakfast", "lunch", "dinner" or "snack"
- All numbers as integers
- Only add when user actually ATE something, not for pure questions`;
  }
}
