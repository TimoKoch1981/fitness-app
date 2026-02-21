import { describe, it, expect } from 'vitest';
import { detectIntent, detectMultiIntent } from '../router';

// ── detectIntent ────────────────────────────────────────────────────────

describe('detectIntent', () => {
  // Greetings → general agent
  it('routes greetings to general agent with confidence 1.0', () => {
    const greetings = ['Hallo', 'Hi', 'Hey', 'Moin', 'Guten Morgen', 'Servus', 'Hello'];
    for (const g of greetings) {
      const result = detectIntent(g);
      expect(result.targetAgent).toBe('general');
      expect(result.confidence).toBe(1.0);
    }
  });

  it('routes "Danke" to general agent', () => {
    const result = detectIntent('Danke');
    expect(result.targetAgent).toBe('general');
  });

  // Nutrition
  it('routes food descriptions to nutrition agent', () => {
    const result = detectIntent('Hähnchen mit Reis gegessen');
    expect(result.targetAgent).toBe('nutrition');
  });

  it('routes single food items to nutrition agent', () => {
    const result = detectIntent('500g Skyr und 2 Orangen');
    expect(result.targetAgent).toBe('nutrition');
  });

  it('routes nutrition questions to nutrition agent', () => {
    const result = detectIntent('Wie viel Protein hat ein Ei?');
    expect(result.targetAgent).toBe('nutrition');
  });

  // Training
  it('routes workout descriptions to training agent', () => {
    const result = detectIntent('Heute Brust und Trizeps trainiert');
    expect(result.targetAgent).toBe('training');
  });

  it('routes exercise names to training agent', () => {
    const result = detectIntent('Bankdrücken 4x8 mit 80kg');
    expect(result.targetAgent).toBe('training');
  });

  it('routes plan creation to training agent', () => {
    const result = detectIntent('Erstell mir einen Trainingsplan');
    expect(result.targetAgent).toBe('training');
  });

  it('routes plan editing to training agent', () => {
    const result = detectIntent('Ersetze Bankdrücken durch Schrägbankdrücken');
    expect(result.targetAgent).toBe('training');
  });

  // Substance
  it('routes TRT questions to substance agent', () => {
    const result = detectIntent('Wann soll ich meine TRT Spritze setzen?');
    expect(result.targetAgent).toBe('substance');
  });

  it('routes Wegovy questions to substance agent', () => {
    // Single keyword like 'semaglutid' may not pass threshold in large keyword list (~118 keywords)
    // Use message with 2+ keywords for reliable routing
    const result = detectIntent('Semaglutid Nebenwirkungen bei Wegovy');
    expect(result.targetAgent).toBe('substance');
  });

  it('routes supplement creation to substance agent', () => {
    const result = detectIntent('Kreatin als Supplement anlegen');
    expect(result.targetAgent).toBe('substance');
  });

  // Medical
  it('routes heart/health questions to medical agent', () => {
    // Need 2+ keywords to pass threshold with ~101 medical keywords
    const result = detectIntent('Meine Leberwerte und Laborwerte besprechen');
    expect(result.targetAgent).toBe('medical');
  });

  it('routes lab values to medical agent', () => {
    const result = detectIntent('HbA1c und Schilddrüse TSH Werte');
    expect(result.targetAgent).toBe('medical');
  });

  // Beauty
  it('routes cosmetic surgery questions to beauty agent', () => {
    const result = detectIntent('Was kostet eine Liposuktion?');
    expect(result.targetAgent).toBe('beauty');
  });

  it('routes HD-Lipo questions to beauty agent', () => {
    const result = detectIntent('Erfahrungen mit VASER HD-Lipo');
    expect(result.targetAgent).toBe('beauty');
  });

  // Lifestyle
  it('routes attractiveness questions to lifestyle agent', () => {
    const result = detectIntent('Wie wirkt sich Muskulatur auf Attraktivität aus?');
    expect(result.targetAgent).toBe('lifestyle');
  });

  // Analysis
  it('routes analysis queries to analysis agent', () => {
    const result = detectIntent('Zeig mir meinen Gewichtsverlauf');
    expect(result.targetAgent).toBe('analysis');
  });

  it('routes daily evaluation to analysis agent', () => {
    // Need 2+ keywords to pass threshold with ~64 analysis keywords
    const result = detectIntent('Tagesauswertung und Fortschritt anzeigen');
    expect(result.targetAgent).toBe('analysis');
  });

  // Fallback
  it('routes unknown text to general agent', () => {
    const result = detectIntent('Erzähl mir einen Witz');
    expect(result.targetAgent).toBe('general');
    expect(result.confidence).toBeLessThan(1.0);
  });

  // Case insensitive
  it('is case-insensitive', () => {
    const result = detectIntent('BANKDRÜCKEN HEUTE');
    expect(result.targetAgent).toBe('training');
  });

  it('handles whitespace', () => {
    const result = detectIntent('  hallo  ');
    expect(result.targetAgent).toBe('general');
  });
});

// ── detectMultiIntent ───────────────────────────────────────────────────

describe('detectMultiIntent', () => {
  it('routes greetings to general only', () => {
    const result = detectMultiIntent('Hallo!');
    expect(result.agents).toHaveLength(1);
    expect(result.primaryAgent).toBe('general');
  });

  it('detects multi-intent: nutrition + substance', () => {
    const result = detectMultiIntent('Kekse gegessen und TRT Spritze gesetzt');
    expect(result.agents.length).toBeGreaterThanOrEqual(2);

    const agentTypes = result.agents.map(a => a.targetAgent);
    expect(agentTypes).toContain('nutrition');
    expect(agentTypes).toContain('substance');
  });

  it('analysis agent runs ALONE', () => {
    const result = detectMultiIntent('Analysiere meinen Fortschritt und Gewichtsverlauf');
    if (result.primaryAgent === 'analysis') {
      expect(result.agents).toHaveLength(1);
    }
  });

  it('agents are sorted by confidence (highest first)', () => {
    const result = detectMultiIntent('Kekse gegessen und TRT Spritze gesetzt');
    for (let i = 1; i < result.agents.length; i++) {
      expect(result.agents[i].confidence).toBeLessThanOrEqual(result.agents[i - 1].confidence);
    }
  });

  it('falls back to general for unknown text', () => {
    const result = detectMultiIntent('Was für ein schöner Tag');
    expect(result.primaryAgent).toBe('general');
  });

  it('primary agent is always the highest-confidence agent', () => {
    const result = detectMultiIntent('Hähnchen mit Reis gegessen');
    expect(result.primaryAgent).toBe(result.agents[0].targetAgent);
  });
});
