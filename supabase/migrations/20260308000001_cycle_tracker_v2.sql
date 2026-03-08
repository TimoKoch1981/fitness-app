-- Cycle Tracker v2: Spotting, Very Heavy Flow, Cervical Mucus, PMS, Sex, BBT
-- Phase A Quick Wins — erweitert menstrual_cycle_logs fuer Clue/Flo Paritaet

-- 1. Spotting als 5. Phase
ALTER TABLE menstrual_cycle_logs DROP CONSTRAINT IF EXISTS menstrual_cycle_logs_phase_check;
ALTER TABLE menstrual_cycle_logs ADD CONSTRAINT menstrual_cycle_logs_phase_check
  CHECK (phase IN ('menstruation','follicular','ovulation','luteal','spotting'));

-- 2. Very Heavy als 4. Flow-Stufe
ALTER TABLE menstrual_cycle_logs DROP CONSTRAINT IF EXISTS menstrual_cycle_logs_flow_intensity_check;
ALTER TABLE menstrual_cycle_logs ADD CONSTRAINT menstrual_cycle_logs_flow_intensity_check
  CHECK (flow_intensity IN ('light','normal','heavy','very_heavy'));

-- 3. Zervixschleim (Billings-Methode: keinen / klebrig / cremig / spinnbar)
ALTER TABLE menstrual_cycle_logs ADD COLUMN IF NOT EXISTS cervical_mucus TEXT
  CHECK (cervical_mucus IS NULL OR cervical_mucus IN ('none','sticky','creamy','egg_white'));

-- 4. PMS-Marker
ALTER TABLE menstrual_cycle_logs ADD COLUMN IF NOT EXISTS pms_flag BOOLEAN DEFAULT false;

-- 5. Sexuelle Aktivitaet (Fertilitaetskontext)
ALTER TABLE menstrual_cycle_logs ADD COLUMN IF NOT EXISTS sexual_activity TEXT
  CHECK (sexual_activity IS NULL OR sexual_activity IN ('none','protected','unprotected'));

-- 6. Basaltemperatur (BBT) fuer spaeteres Phase-C-Feature
ALTER TABLE menstrual_cycle_logs ADD COLUMN IF NOT EXISTS basal_temp NUMERIC(4,2)
  CHECK (basal_temp IS NULL OR (basal_temp >= 35.0 AND basal_temp <= 42.0));

-- Schema-Cache neu laden (PostgREST)
NOTIFY pgrst, 'reload schema';
