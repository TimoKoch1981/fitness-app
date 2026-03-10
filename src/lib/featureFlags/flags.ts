/**
 * Default feature flag configuration.
 * Loaded from code; can be overridden by Supabase in the future.
 */

import type { FeatureFlagConfig } from './types';

export const DEFAULT_FLAGS: FeatureFlagConfig = {
  barcode_scanner: {
    id: 'barcode_scanner',
    name: 'Barcode Scanner',
    description: 'Scan product barcodes to quickly add meals',
    enabled: true,
  },
  ai_body_scan: {
    id: 'ai_body_scan',
    name: 'AI Body Scan',
    description: 'AI-powered body composition estimation from photos',
    enabled: true,
  },
  recipes: {
    id: 'recipes',
    name: 'Recipes',
    description: 'Recipe database and meal planning',
    enabled: true,
  },
  periodization: {
    id: 'periodization',
    name: 'Periodization',
    description: 'Training periodization and cycle planning',
    enabled: true,
  },
  gamification: {
    id: 'gamification',
    name: 'Gamification',
    description: 'Badges, streaks, and challenges',
    enabled: true,
  },
  water_widget: {
    id: 'water_widget',
    name: 'Water Widget',
    description: 'Water intake tracking widget on cockpit',
    enabled: true,
  },
  weekly_report: {
    id: 'weekly_report',
    name: 'Weekly Report',
    description: 'Automated weekly progress reports',
    enabled: true,
  },
  pwa_offline: {
    id: 'pwa_offline',
    name: 'PWA Offline',
    description: 'Offline mode for Progressive Web App',
    enabled: true,
  },
  apple_oauth: {
    id: 'apple_oauth',
    name: 'Apple OAuth',
    description: 'Sign in with Apple (requires Apple Developer Account)',
    enabled: false,
  },
  social_features: {
    id: 'social_features',
    name: 'Social Features',
    description: 'Social feed, friend challenges, and sharing',
    enabled: false,
  },
  marketplace: {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'In-app marketplace for plans and coaching',
    enabled: false,
  },
};
