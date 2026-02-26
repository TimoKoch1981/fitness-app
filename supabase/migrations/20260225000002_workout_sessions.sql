-- ============================================================
-- Migration: Workout Sessions (Live-Tracking)
-- Erweitert die workouts-Tabelle um Session-Tracking-Felder
-- fuer Satz-fuer-Satz Dokumentation waehrend des Trainings.
-- ============================================================

-- Neue Spalten fuer Plan-Verknuepfung
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES training_plans(id) ON DELETE SET NULL;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS plan_day_id UUID REFERENCES training_plan_days(id) ON DELETE SET NULL;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS plan_day_number INT;

-- Detaillierte Session-Daten (per-Set Ergebnisse)
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS session_exercises JSONB DEFAULT NULL;

-- Cardio-Warmup Dokumentation
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS warmup JSONB DEFAULT NULL;

-- Session-Zeitstempel
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ;

-- Index fuer schnelle Abfrage: "Letztes Training fuer diesen Plan-Tag"
CREATE INDEX IF NOT EXISTS idx_workouts_plan_day ON workouts(plan_id, plan_day_number);

-- Index fuer Uebungs-Historie (user + plan)
CREATE INDEX IF NOT EXISTS idx_workouts_user_plan ON workouts(user_id, plan_id) WHERE plan_id IS NOT NULL;
