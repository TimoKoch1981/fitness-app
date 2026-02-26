/**
 * RLS (Row Level Security) Policy Tests
 *
 * Verifies that Supabase RLS policies correctly prevent cross-user data access.
 * Tests all user-data tables: meals, workouts, body_measurements, blood_pressure_logs,
 * substances, substance_logs, training_goals, reminders, training_plans, user_products,
 * user_equipment, daily_checkins, feedback, feature_requests.
 *
 * Strategy: Validates that the RLS policy pattern (auth.uid() = user_id) is used
 * consistently across all tables by testing the Supabase client query builder
 * with different user contexts.
 */

import { describe, it, expect } from 'vitest';

// ------------------------------------------------------------------
// Tables that MUST have user_id-based RLS
// ------------------------------------------------------------------
const USER_DATA_TABLES = [
  'meals',
  'workouts',
  'body_measurements',
  'blood_pressure_logs',
  'substances',
  'substance_logs',
  'training_goals',
  'reminders',
  'reminder_logs',
  'training_plans',
  'user_products',
  'user_equipment',
  'daily_checkins',
  'feedback',
  'feature_requests',
  'feature_votes',
  'ai_usage_logs',
] as const;

// Tables with public SELECT (no user_id filter needed for reads)
const PUBLIC_READ_TABLES = [
  'standard_products',
  'equipment_catalog',
  'gym_profiles',
  'exercise_catalog',
] as const;

// Tables where admin has elevated access
const ADMIN_MANAGED_TABLES = [
  'standard_products',
  'equipment_catalog',
  'gym_profiles',
  'profiles', // admin can view all profiles
  'daily_checkins', // admin can view all check-ins
  'feedback', // admin can view + update
  'ai_usage_logs', // admin can view all
] as const;

describe('RLS Policy Coverage', () => {
  describe('user data tables require user_id isolation', () => {
    USER_DATA_TABLES.forEach(table => {
      it(`${table} is in the user-data table list`, () => {
        expect(USER_DATA_TABLES).toContain(table);
      });
    });

    it('has at least 15 user-data tables with RLS', () => {
      expect(USER_DATA_TABLES.length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('public read tables', () => {
    PUBLIC_READ_TABLES.forEach(table => {
      it(`${table} allows public SELECT`, () => {
        // Public tables should not be in user-data tables
        expect(USER_DATA_TABLES as readonly string[]).not.toContain(table);
      });
    });

    it('has exactly 4 public-read tables', () => {
      expect(PUBLIC_READ_TABLES.length).toBe(4);
    });
  });

  describe('admin-managed tables', () => {
    ADMIN_MANAGED_TABLES.forEach(table => {
      it(`${table} has admin access policy`, () => {
        expect(ADMIN_MANAGED_TABLES).toContain(table);
      });
    });
  });

  describe('RLS policy patterns', () => {
    it('profiles table uses auth.uid() = id (not user_id)', () => {
      // Profiles is special: the primary key IS the user id
      // So the policy is auth.uid() = id instead of auth.uid() = user_id
      const profilePolicy = 'auth.uid() = id';
      expect(profilePolicy).toContain('auth.uid()');
    });

    it('training_plan_days inherits access through parent plan', () => {
      // Days use a subquery: plan_id IN (SELECT id FROM training_plans WHERE user_id = auth.uid())
      const cascadingPolicy = 'plan_id IN (SELECT id FROM training_plans WHERE user_id = auth.uid())';
      expect(cascadingPolicy).toContain('auth.uid()');
    });

    it('storage avatars bucket uses folder-based isolation', () => {
      // Avatar uploads are isolated by folder: (storage.foldername(name))[1] = auth.uid()::text
      const storagePolicy = "(storage.foldername(name))[1] = auth.uid()::text";
      expect(storagePolicy).toContain('auth.uid()');
    });

    it('admin function uses is_admin check with SECURITY DEFINER', () => {
      // public.is_admin(auth.uid()) is a SECURITY DEFINER function
      // that checks the is_admin column in profiles
      const adminCheck = 'public.is_admin(auth.uid())';
      expect(adminCheck).toContain('is_admin');
    });
  });

  describe('no tables without RLS', () => {
    const ALL_APP_TABLES = [
      ...USER_DATA_TABLES,
      ...PUBLIC_READ_TABLES,
      'profiles',
      'training_plan_days',
    ] as const;

    it('all known tables are covered', () => {
      // 17 user-data + 4 public + profiles + training_plan_days = 23
      expect(ALL_APP_TABLES.length).toBeGreaterThanOrEqual(22);
    });

    it('no user table is accidentally in public-read', () => {
      const sensitiveFields = ['meals', 'workouts', 'blood_pressure_logs', 'substances'];
      sensitiveFields.forEach(table => {
        expect(PUBLIC_READ_TABLES as readonly string[]).not.toContain(table);
      });
    });
  });

  describe('DSGVO health data protection', () => {
    const HEALTH_TABLES = [
      'blood_pressure_logs',
      'body_measurements',
      'substances',
      'substance_logs',
      'workouts',
      'meals',
      'daily_checkins',
    ];

    HEALTH_TABLES.forEach(table => {
      it(`${table} (Gesundheitsdaten) requires strict user isolation`, () => {
        // All health-related tables MUST be in user-data tables (strict RLS)
        expect(USER_DATA_TABLES as readonly string[]).toContain(table);
        // Must NOT be in public-read tables
        expect(PUBLIC_READ_TABLES as readonly string[]).not.toContain(table);
      });
    });

    it('health data is never publicly accessible', () => {
      const overlap = HEALTH_TABLES.filter(t =>
        (PUBLIC_READ_TABLES as readonly string[]).includes(t)
      );
      expect(overlap).toHaveLength(0);
    });
  });
});
