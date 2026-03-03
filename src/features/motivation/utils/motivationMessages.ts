/**
 * Motivation messages for inactivity re-engagement.
 * Messages are organized by inactivity tier (3-day, 5-day, 7-day).
 * Each message references an i18n key for full localization.
 */

export interface MotivationMessage {
  /** i18n key for the message text (under motivation.*) */
  textKey: string;
  /** Route to navigate when the user taps the action button */
  actionRoute: '/training' | '/nutrition';
  /** i18n key for the action button label (under motivation.*) */
  actionLabelKey: string;
}

/** Gentle nudge — 3-4 days of inactivity */
export const TIER_3_MESSAGES: MotivationMessage[] = [
  { textKey: 'tier3_msg1', actionRoute: '/training', actionLabelKey: 'startTraining' },
  { textKey: 'tier3_msg2', actionRoute: '/nutrition', actionLabelKey: 'logMeal' },
  { textKey: 'tier3_msg3', actionRoute: '/training', actionLabelKey: 'startTraining' },
  { textKey: 'tier3_msg4', actionRoute: '/nutrition', actionLabelKey: 'logMeal' },
];

/** Supportive — 5-6 days of inactivity */
export const TIER_5_MESSAGES: MotivationMessage[] = [
  { textKey: 'tier5_msg1', actionRoute: '/training', actionLabelKey: 'startTraining' },
  { textKey: 'tier5_msg2', actionRoute: '/nutrition', actionLabelKey: 'logMeal' },
  { textKey: 'tier5_msg3', actionRoute: '/training', actionLabelKey: 'startTraining' },
  { textKey: 'tier5_msg4', actionRoute: '/nutrition', actionLabelKey: 'logMeal' },
];

/** Re-engagement — 7+ days of inactivity */
export const TIER_7_MESSAGES: MotivationMessage[] = [
  { textKey: 'tier7_msg1', actionRoute: '/training', actionLabelKey: 'startTraining' },
  { textKey: 'tier7_msg2', actionRoute: '/nutrition', actionLabelKey: 'logMeal' },
  { textKey: 'tier7_msg3', actionRoute: '/training', actionLabelKey: 'startTraining' },
  { textKey: 'tier7_msg4', actionRoute: '/nutrition', actionLabelKey: 'logMeal' },
];

/**
 * Returns the appropriate message tier for the given inactivity duration.
 */
export function getMessageTier(daysSinceLastActivity: number): MotivationMessage[] {
  if (daysSinceLastActivity >= 7) return TIER_7_MESSAGES;
  if (daysSinceLastActivity >= 5) return TIER_5_MESSAGES;
  return TIER_3_MESSAGES;
}

/**
 * Picks a pseudo-random message from the appropriate tier.
 * Uses the current date as seed so the message stays consistent within a day.
 */
export function pickMotivationMessage(daysSinceLastActivity: number): MotivationMessage {
  const tier = getMessageTier(daysSinceLastActivity);
  // Use today's date as a simple seed for consistent daily selection
  const today = new Date();
  const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = dateSeed % tier.length;
  return tier[index];
}

/**
 * Returns the tier label key for the given inactivity duration.
 */
export function getTierKey(daysSinceLastActivity: number): 'gentle' | 'supportive' | 'reengagement' {
  if (daysSinceLastActivity >= 7) return 'reengagement';
  if (daysSinceLastActivity >= 5) return 'supportive';
  return 'gentle';
}
