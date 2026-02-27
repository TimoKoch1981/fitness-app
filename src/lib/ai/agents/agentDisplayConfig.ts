/**
 * Agent Display Configuration — centralized metadata for thread tabs.
 *
 * Keeps UI layer decoupled from agent execution.
 * Used by AgentThreadTabs, BuddyPage greeting, InlineBuddyChat.
 */

import type { AgentType } from './types';

export interface AgentDisplayConfig {
  type: AgentType;
  /** DE display name */
  name: string;
  /** EN display name */
  nameEN: string;
  /** Emoji icon */
  icon: string;
  /** DE short label for tab (max ~10 chars) */
  shortName: string;
  /** EN short label for tab */
  shortNameEN: string;
  /** Tailwind gradient classes (from-X to-Y) */
  color: string;
  /** DE greeting shown in empty thread */
  greeting: string;
  /** EN greeting */
  greetingEN: string;
}

export const AGENT_DISPLAY_CONFIG: Record<AgentType, AgentDisplayConfig> = {
  general: {
    type: 'general',
    name: 'FitBuddy',
    nameEN: 'FitBuddy',
    icon: '🤖',
    shortName: 'Buddy',
    shortNameEN: 'Buddy',
    color: 'from-teal-500 to-emerald-600',
    greeting: 'Hey! Ich bin dein FitBuddy. Stell mir eine beliebige Frage — ich leite dich zum richtigen Experten weiter.',
    greetingEN: 'Hey! I\'m your FitBuddy. Ask me anything — I\'ll route you to the right expert.',
  },
  nutrition: {
    type: 'nutrition',
    name: 'Ernährungs-Agent',
    nameEN: 'Nutrition Agent',
    icon: '🍽️',
    shortName: 'Essen',
    shortNameEN: 'Food',
    color: 'from-orange-400 to-amber-500',
    greeting: 'Hi! Ich bin dein Ernährungsberater. Erzähl mir was du gegessen hast oder frag mich zu Nährwerten!',
    greetingEN: 'Hi! I\'m your nutrition advisor. Tell me what you ate or ask me about nutritional values!',
  },
  training: {
    type: 'training',
    name: 'Trainings-Agent',
    nameEN: 'Training Agent',
    icon: '💪',
    shortName: 'Training',
    shortNameEN: 'Training',
    color: 'from-blue-500 to-indigo-600',
    greeting: 'Hi! Ich bin dein Personal Trainer. Frag mich zu Trainingsplaenen, Uebungen oder deinem Fortschritt!',
    greetingEN: 'Hi! I\'m your personal trainer. Ask me about training plans, exercises, or your progress!',
  },
  substance: {
    type: 'substance',
    name: 'Substanz-Agent',
    nameEN: 'Substance Agent',
    icon: '💊',
    shortName: 'Substanzen',
    shortNameEN: 'Substances',
    color: 'from-purple-500 to-violet-600',
    greeting: 'Hi! Ich bin dein Substanz-Berater. Frag mich zu Supplements, Medikamenten oder Wirkungen.',
    greetingEN: 'Hi! I\'m your substance advisor. Ask me about supplements, medications, or effects.',
  },
  analysis: {
    type: 'analysis',
    name: 'Analyse-Agent',
    nameEN: 'Analysis Agent',
    icon: '📊',
    shortName: 'Analyse',
    shortNameEN: 'Analysis',
    color: 'from-cyan-500 to-teal-600',
    greeting: 'Hi! Ich bin dein Analyse-Agent. Ich werte deine Trends, Koerperdaten und Fortschritte aus.',
    greetingEN: 'Hi! I\'m your analysis agent. I evaluate your trends, body data, and progress.',
  },
  beauty: {
    type: 'beauty',
    name: 'Beauty-Agent',
    nameEN: 'Beauty Agent',
    icon: '✨',
    shortName: 'Beauty',
    shortNameEN: 'Beauty',
    color: 'from-pink-400 to-rose-500',
    greeting: 'Hi! Ich bin dein Beauty-Berater. Frag mich zu aesthetischen Massnahmen und Pflege.',
    greetingEN: 'Hi! I\'m your beauty advisor. Ask me about aesthetic procedures and care.',
  },
  lifestyle: {
    type: 'lifestyle',
    name: 'Lifestyle-Agent',
    nameEN: 'Lifestyle Agent',
    icon: '🌟',
    shortName: 'Lifestyle',
    shortNameEN: 'Lifestyle',
    color: 'from-amber-400 to-yellow-500',
    greeting: 'Hi! Ich bin dein Lifestyle-Berater. Ich helfe bei Ausstrahlung, Stil und Auftreten.',
    greetingEN: 'Hi! I\'m your lifestyle advisor. I help with charisma, style, and presence.',
  },
  medical: {
    type: 'medical',
    name: 'Medical-Agent',
    nameEN: 'Medical Agent',
    icon: '🏥',
    shortName: 'Medizin',
    shortNameEN: 'Medical',
    color: 'from-red-400 to-rose-600',
    greeting: 'Hi! Ich bin dein Medical-Agent. Frag mich zu Laborwerten, Blutdruck oder Gesundheitsthemen.',
    greetingEN: 'Hi! I\'m your medical agent. Ask me about lab values, blood pressure, or health topics.',
  },
};

/** Tab order for the thread selector — General first, then by frequency */
export const THREAD_TAB_ORDER: AgentType[] = [
  'general', 'nutrition', 'training', 'substance', 'analysis', 'medical', 'beauty', 'lifestyle',
];

/** Helper to get display config for an agent type */
export function getAgentDisplayConfig(type: AgentType): AgentDisplayConfig {
  return AGENT_DISPLAY_CONFIG[type];
}
