-- KI-Trainer Review-System: Neue Felder fuer AI-supervised Training
-- Konzept: docs/KONZEPT_KI_TRAINER.md (freigegeben 2026-03-05)

-- training_plans: "Supervised by AI" Flag + Review-Konfiguration
ALTER TABLE training_plans ADD COLUMN IF NOT EXISTS ai_supervised BOOLEAN DEFAULT false;
ALTER TABLE training_plans ADD COLUMN IF NOT EXISTS review_config JSONB DEFAULT '{}';

-- review_config Schema:
-- {
--   "mesocycle_weeks": 4,           -- Laenge eines Mesozyklus
--   "deload_week": 4,               -- Deload in Woche X
--   "review_triggers": {
--     "plateau_sessions": 3,        -- Sessions ohne Progression → Alarm
--     "missed_sessions_pct": 30,    -- % verpasste Sessions → Alarm
--     "joint_pain_threshold": 3,    -- Pain-Rating >= X → Uebung tauschen
--     "sleep_days_threshold": 5,    -- Tage mit <6h Schlaf → Deload
--     "rpe_drift_threshold": 2      -- RPE-Anstieg bei gleicher Last → Fatigue
--   },
--   "current_week": 1,              -- Aktuelle Woche im Mesozyklus
--   "mesocycle_start": "2026-03-06", -- Start des aktuellen Mesozyklus
--   "last_review": null,            -- Letzter Review-Zeitpunkt
--   "next_review": "2026-04-03",    -- Naechster geplanter Review
--   "experience_level": "intermediate", -- beginner/intermediate/advanced
--   "calibration_done": false       -- Erste Session kalibriert?
-- }

-- workouts: Post-Session-Feedback (optional, ein/ausschaltbar)
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS session_feedback JSONB DEFAULT NULL;

-- session_feedback Schema:
-- {
--   "overall_feeling": "good",      -- "easy" | "good" | "hard" | "exhausted"
--   "joint_pain": [],               -- ["left_shoulder", "right_knee"]
--   "joint_pain_rating": 0,         -- 0-5
--   "completion_rate": 0.95,        -- automatisch berechnet
--   "exercises_skipped": [],        -- ["Uebung X"]
--   "auto_calculated": {
--     "volume_per_muscle": {},       -- { "chest": 12, "back": 15, ... }
--     "plateau_exercises": [],       -- Uebungen ohne Fortschritt seit 3x
--     "rpe_drift_exercises": []      -- RPE gestiegen bei gleicher Last
--   }
-- }

-- profiles: Globaler KI-Trainer Toggle
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_trainer_enabled BOOLEAN DEFAULT false;

-- Indexes fuer Performance
CREATE INDEX IF NOT EXISTS idx_training_plans_ai_supervised
  ON training_plans(user_id, ai_supervised)
  WHERE ai_supervised = true;

CREATE INDEX IF NOT EXISTS idx_workouts_session_feedback
  ON workouts(plan_id, created_at)
  WHERE session_feedback IS NOT NULL;

-- Audit-Trigger fuer review_config Aenderungen (DSGVO)
-- Der bestehende audit_trigger auf training_plans deckt das bereits ab,
-- da er alle Spalten-Aenderungen trackt.

-- PostgREST Schema-Cache erneuern (wichtig bei neuen Spalten!)
NOTIFY pgrst, 'reload schema';
